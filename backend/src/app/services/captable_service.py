from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.allocation import Allocation
from app.models.equity_event import EquityEvent
from app.models.share_class import ShareClass
from app.models.stakeholder import Stakeholder
from app.schemas.captable import (
    AllocationRead,
    CapTableEvolutionEntry,
    CapTableKPIs,
    CapTableRow,
    CapTableSnapshot,
    EquityEventCreate,
    EquityEventRead,
    ShareClassCreate,
    ShareClassRead,
    StakeholderCreate,
    StakeholderUpdate,
)


class CapTableService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Share Classes ────────────────────────────────────────

    async def create_share_class(
        self, company_id: str, data: ShareClassCreate
    ) -> ShareClass:
        sc = ShareClass(company_id=company_id, **data.model_dump())
        self.session.add(sc)
        await self.session.commit()
        await self.session.refresh(sc)
        return sc

    async def list_share_classes(self, company_id: str) -> list[ShareClass]:
        stmt = (
            select(ShareClass)
            .where(ShareClass.company_id == company_id)
            .order_by(ShareClass.seniority)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_share_class(self, share_class_id: str) -> bool:
        stmt = select(ShareClass).where(ShareClass.id == share_class_id)
        result = await self.session.execute(stmt)
        sc = result.scalar_one_or_none()
        if not sc:
            return False
        await self.session.delete(sc)
        await self.session.commit()
        return True

    # ── Stakeholders ─────────────────────────────────────────

    async def create_stakeholder(
        self, company_id: str, data: StakeholderCreate
    ) -> Stakeholder:
        sh = Stakeholder(company_id=company_id, **data.model_dump())
        self.session.add(sh)
        await self.session.commit()
        await self.session.refresh(sh)
        return sh

    async def update_stakeholder(
        self, stakeholder_id: str, data: StakeholderUpdate
    ) -> Stakeholder | None:
        stmt = select(Stakeholder).where(Stakeholder.id == stakeholder_id)
        result = await self.session.execute(stmt)
        sh = result.scalar_one_or_none()
        if not sh:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(sh, field, value)
        await self.session.commit()
        await self.session.refresh(sh)
        return sh

    async def delete_stakeholder(self, stakeholder_id: str) -> bool:
        stmt = select(Stakeholder).where(Stakeholder.id == stakeholder_id)
        result = await self.session.execute(stmt)
        sh = result.scalar_one_or_none()
        if not sh:
            return False
        await self.session.delete(sh)
        await self.session.commit()
        return True

    async def list_stakeholders(self, company_id: str) -> list[Stakeholder]:
        stmt = (
            select(Stakeholder)
            .where(Stakeholder.company_id == company_id)
            .order_by(Stakeholder.name)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ── Equity Events ────────────────────────────────────────

    async def create_equity_event(
        self, company_id: str, data: EquityEventCreate
    ) -> EquityEvent:
        event_data = data.model_dump(exclude={"allocations"})
        # Parse date string
        date_str = event_data.pop("date", None)
        if date_str:
            try:
                event_data["date"] = datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                event_data["date"] = None

        event = EquityEvent(company_id=company_id, **event_data)
        self.session.add(event)
        await self.session.flush()  # get event.id

        for alloc_data in data.allocations:
            alloc = Allocation(
                equity_event_id=event.id,
                **alloc_data.model_dump(),
            )
            self.session.add(alloc)

        await self.session.commit()

        # Reload with relationships
        stmt = (
            select(EquityEvent)
            .where(EquityEvent.id == event.id)
            .options(
                selectinload(EquityEvent.allocations).selectinload(Allocation.stakeholder),
                selectinload(EquityEvent.allocations).selectinload(Allocation.share_class),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def list_equity_events(self, company_id: str) -> list[EquityEvent]:
        stmt = (
            select(EquityEvent)
            .where(EquityEvent.company_id == company_id)
            .options(
                selectinload(EquityEvent.allocations).selectinload(Allocation.stakeholder),
                selectinload(EquityEvent.allocations).selectinload(Allocation.share_class),
            )
            .order_by(EquityEvent.date)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_equity_event(self, event_id: str) -> bool:
        stmt = select(EquityEvent).where(EquityEvent.id == event_id)
        result = await self.session.execute(stmt)
        event = result.scalar_one_or_none()
        if not event:
            return False
        await self.session.delete(event)
        await self.session.commit()
        return True

    # ── Cap Table Snapshot ───────────────────────────────────

    async def get_cap_table(self, company_id: str) -> CapTableSnapshot:
        events = await self.list_equity_events(company_id)
        share_classes = await self.list_share_classes(company_id)
        stakeholders = await self.list_stakeholders(company_id)

        # Aggregate all allocations
        stakeholder_map: dict[str, Stakeholder] = {s.id: s for s in stakeholders}
        shares_by_stakeholder: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        invested_by_stakeholder: dict[str, float] = defaultdict(float)

        total_shares = 0
        for event in events:
            for alloc in event.allocations:
                shares_by_stakeholder[alloc.stakeholder_id][alloc.share_class_id] += alloc.shares
                total_shares += alloc.shares
                if alloc.amount_invested:
                    invested_by_stakeholder[alloc.stakeholder_id] += alloc.amount_invested

        rows: list[CapTableRow] = []
        for sid, class_shares in shares_by_stakeholder.items():
            sh = stakeholder_map.get(sid)
            if not sh:
                continue
            s_total = sum(class_shares.values())
            pct = (s_total / total_shares * 100) if total_shares > 0 else 0
            rows.append(
                CapTableRow(
                    stakeholder=StakeholderRead.model_validate(sh),
                    shares_by_class=class_shares,
                    total_shares=s_total,
                    ownership_pct=round(pct, 2),
                    total_invested=invested_by_stakeholder.get(sid, 0),
                )
            )

        rows.sort(key=lambda r: r.ownership_pct, reverse=True)

        return CapTableSnapshot(
            rows=rows,
            total_shares=total_shares,
            share_classes=[ShareClassRead.model_validate(sc) for sc in share_classes],
        )

    async def get_kpis(self, company_id: str) -> CapTableKPIs:
        events = await self.list_equity_events(company_id)
        stakeholders = await self.list_stakeholders(company_id)

        total_raised = 0.0
        last_valuation: float | None = None
        post_money: float | None = None
        last_round_name: str | None = None
        rounds_count = 0

        # Walk events chronologically
        for event in events:
            if event.amount_raised:
                total_raised += event.amount_raised
            if event.event_type in ("funding_round", "incorporation"):
                rounds_count += 1
                last_round_name = event.name
                if event.pre_money_valuation:
                    last_valuation = event.pre_money_valuation
                    post_money = event.pre_money_valuation + (event.amount_raised or 0)

        # Compute founder ownership from snapshot
        snapshot = await self.get_cap_table(company_id)
        founder_pct = sum(
            row.ownership_pct for row in snapshot.rows
            if row.stakeholder.type == "founder"
        )

        return CapTableKPIs(
            last_valuation=last_valuation,
            post_money_valuation=post_money,
            total_raised=total_raised,
            total_shareholders=len(stakeholders),
            founder_ownership_pct=round(founder_pct, 2),
            total_shares=snapshot.total_shares,
            rounds_count=rounds_count,
            last_round_name=last_round_name,
        )

    async def get_cap_table_evolution(
        self, company_id: str
    ) -> list[CapTableEvolutionEntry]:
        events = await self.list_equity_events(company_id)
        stakeholders = await self.list_stakeholders(company_id)

        stakeholder_map: dict[str, Stakeholder] = {s.id: s for s in stakeholders}
        cumulative_shares: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        cumulative_invested: dict[str, float] = defaultdict(float)
        cumulative_total = 0

        evolution: list[CapTableEvolutionEntry] = []

        for event in events:
            for alloc in event.allocations:
                cumulative_shares[alloc.stakeholder_id][alloc.share_class_id] += alloc.shares
                cumulative_total += alloc.shares
                if alloc.amount_invested:
                    cumulative_invested[alloc.stakeholder_id] += alloc.amount_invested

            # Build snapshot at this point
            rows: list[CapTableRow] = []
            for sid, class_shares in cumulative_shares.items():
                sh = stakeholder_map.get(sid)
                if not sh:
                    continue
                s_total = sum(class_shares.values())
                pct = (s_total / cumulative_total * 100) if cumulative_total > 0 else 0
                rows.append(
                    CapTableRow(
                        stakeholder=StakeholderRead.model_validate(sh),
                        shares_by_class=dict(class_shares),
                        total_shares=s_total,
                        ownership_pct=round(pct, 2),
                        total_invested=cumulative_invested.get(sid, 0),
                    )
                )
            rows.sort(key=lambda r: r.ownership_pct, reverse=True)

            # Build event read with allocation details
            alloc_reads = []
            for a in event.allocations:
                alloc_reads.append(
                    AllocationRead(
                        id=a.id,
                        stakeholder_id=a.stakeholder_id,
                        stakeholder_name=a.stakeholder.name if a.stakeholder else None,
                        share_class_id=a.share_class_id,
                        share_class_name=a.share_class.name if a.share_class else None,
                        shares=a.shares,
                        amount_invested=a.amount_invested,
                        ownership_pct=a.ownership_pct,
                        notes=a.notes,
                    )
                )

            event_read = EquityEventRead(
                id=event.id,
                name=event.name,
                event_type=event.event_type,
                date=event.date,
                pre_money_valuation=event.pre_money_valuation,
                amount_raised=event.amount_raised,
                price_per_share=event.price_per_share,
                total_shares_after=event.total_shares_after,
                notes=event.notes,
                allocations=alloc_reads,
                created_at=event.created_at,
            )

            evolution.append(
                CapTableEvolutionEntry(event=event_read, snapshot=rows)
            )

        return evolution


# ── Serialization helpers for routes ─────────────────────────

def serialize_event(event: EquityEvent) -> dict:
    """Convert an EquityEvent ORM object to an EquityEventRead-compatible dict."""
    allocs = []
    for a in event.allocations:
        allocs.append(
            AllocationRead(
                id=a.id,
                stakeholder_id=a.stakeholder_id,
                stakeholder_name=a.stakeholder.name if a.stakeholder else None,
                share_class_id=a.share_class_id,
                share_class_name=a.share_class.name if a.share_class else None,
                shares=a.shares,
                amount_invested=a.amount_invested,
                ownership_pct=a.ownership_pct,
                notes=a.notes,
            )
        )
    return EquityEventRead(
        id=event.id,
        name=event.name,
        event_type=event.event_type,
        date=event.date,
        pre_money_valuation=event.pre_money_valuation,
        amount_raised=event.amount_raised,
        price_per_share=event.price_per_share,
        total_shares_after=event.total_shares_after,
        notes=event.notes,
        allocations=allocs,
        created_at=event.created_at,
    )
