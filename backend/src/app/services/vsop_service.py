from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.vsop_grant import VsopGrant
from app.models.vsop_pool import VsopPool
from app.schemas.vsop import (
    VsopGrantCreate,
    VsopGrantRead,
    VsopGrantUpdate,
    VsopPoolCreate,
    VsopPoolRead,
    VsopPoolUpdate,
    VsopSummary,
)


def _compute_vesting(grant: VsopGrant) -> dict:
    """Compute vested/unvested shares based on grant date and today."""
    if not grant.grant_date or grant.status == "terminated":
        return {
            "vested_shares": 0,
            "unvested_shares": grant.shares_granted if grant.status != "terminated" else 0,
            "vesting_pct": 0.0,
            "cliff_met": False,
        }

    if grant.status == "fully_vested":
        return {
            "vested_shares": grant.shares_granted,
            "unvested_shares": 0,
            "vesting_pct": 100.0,
            "cliff_met": True,
        }

    now = datetime.now(timezone.utc)
    grant_date = grant.grant_date
    if grant_date.tzinfo is None:
        grant_date = grant_date.replace(tzinfo=timezone.utc)

    # Months elapsed since grant
    months_elapsed = (
        (now.year - grant_date.year) * 12 + (now.month - grant_date.month)
    )

    # Check cliff
    cliff_met = months_elapsed >= grant.cliff_months
    if not cliff_met:
        return {
            "vested_shares": 0,
            "unvested_shares": grant.shares_granted,
            "vesting_pct": 0.0,
            "cliff_met": False,
        }

    # Linear vesting after cliff
    if months_elapsed >= grant.vesting_months:
        return {
            "vested_shares": grant.shares_granted,
            "unvested_shares": 0,
            "vesting_pct": 100.0,
            "cliff_met": True,
        }

    vested = int(grant.shares_granted * months_elapsed / grant.vesting_months)
    unvested = grant.shares_granted - vested
    pct = round(vested / grant.shares_granted * 100, 1) if grant.shares_granted > 0 else 0

    return {
        "vested_shares": vested,
        "unvested_shares": unvested,
        "vesting_pct": pct,
        "cliff_met": True,
    }


def _grant_to_read(grant: VsopGrant) -> VsopGrantRead:
    vesting = _compute_vesting(grant)
    return VsopGrantRead(
        id=grant.id,
        stakeholder_id=grant.stakeholder_id,
        stakeholder_name=grant.stakeholder.name if grant.stakeholder else None,
        shares_granted=grant.shares_granted,
        strike_price=grant.strike_price,
        grant_date=grant.grant_date,
        cliff_months=grant.cliff_months,
        vesting_months=grant.vesting_months,
        status=grant.status,
        notes=grant.notes,
        created_at=grant.created_at,
        **vesting,
    )


class VsopService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Pool ─────────────────────────────────────────────────

    async def get_pool(self, company_id: str) -> VsopPool | None:
        stmt = select(VsopPool).where(VsopPool.company_id == company_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_pool(
        self, company_id: str, data: VsopPoolCreate | VsopPoolUpdate
    ) -> VsopPool:
        existing = await self.get_pool(company_id)
        update_data = data.model_dump(exclude_unset=True)

        if existing:
            for field, value in update_data.items():
                setattr(existing, field, value)
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        pool = VsopPool(company_id=company_id, **update_data)
        self.session.add(pool)
        await self.session.commit()
        await self.session.refresh(pool)
        return pool

    async def delete_pool(self, company_id: str) -> bool:
        pool = await self.get_pool(company_id)
        if not pool:
            return False
        await self.session.delete(pool)
        await self.session.commit()
        return True

    # ── Grants ───────────────────────────────────────────────

    async def _list_grants(self, pool_id: str) -> list[VsopGrant]:
        stmt = (
            select(VsopGrant)
            .where(VsopGrant.pool_id == pool_id)
            .options(selectinload(VsopGrant.stakeholder))
            .order_by(VsopGrant.grant_date)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_grant(
        self, company_id: str, data: VsopGrantCreate
    ) -> VsopGrantRead:
        pool = await self.get_pool(company_id)
        if not pool:
            raise ValueError("No VSOP pool exists for this company")

        grant_data = data.model_dump(exclude={"grant_date"})
        if data.grant_date:
            try:
                grant_data["grant_date"] = datetime.fromisoformat(data.grant_date)
            except (ValueError, TypeError):
                grant_data["grant_date"] = None

        grant = VsopGrant(pool_id=pool.id, **grant_data)
        self.session.add(grant)
        await self.session.commit()

        # Reload with stakeholder
        stmt = (
            select(VsopGrant)
            .where(VsopGrant.id == grant.id)
            .options(selectinload(VsopGrant.stakeholder))
        )
        result = await self.session.execute(stmt)
        return _grant_to_read(result.scalar_one())

    async def update_grant(
        self, grant_id: str, data: VsopGrantUpdate
    ) -> VsopGrantRead | None:
        stmt = (
            select(VsopGrant)
            .where(VsopGrant.id == grant_id)
            .options(selectinload(VsopGrant.stakeholder))
        )
        result = await self.session.execute(stmt)
        grant = result.scalar_one_or_none()
        if not grant:
            return None

        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "grant_date" and isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    value = None
            setattr(grant, field, value)

        await self.session.commit()
        await self.session.refresh(grant)
        return _grant_to_read(grant)

    async def delete_grant(self, grant_id: str) -> bool:
        stmt = select(VsopGrant).where(VsopGrant.id == grant_id)
        result = await self.session.execute(stmt)
        grant = result.scalar_one_or_none()
        if not grant:
            return False
        await self.session.delete(grant)
        await self.session.commit()
        return True

    # ── Summary ──────────────────────────────────────────────

    async def get_summary(self, company_id: str) -> VsopSummary:
        pool = await self.get_pool(company_id)
        if not pool:
            return VsopSummary(
                pool=None,
                grants=[],
                total_granted=0,
                total_available=0,
                total_vested=0,
                total_unvested=0,
                pool_utilization_pct=0,
                overall_vesting_pct=0,
            )

        raw_grants = await self._list_grants(pool.id)
        grants = [_grant_to_read(g) for g in raw_grants]

        active_grants = [g for g in grants if g.status != "terminated"]
        total_granted = sum(g.shares_granted for g in active_grants)
        total_vested = sum(g.vested_shares for g in active_grants)
        total_unvested = sum(g.unvested_shares for g in active_grants)
        total_available = pool.total_shares - total_granted

        pool_util = (
            round(total_granted / pool.total_shares * 100, 1)
            if pool.total_shares > 0 else 0
        )
        overall_vest = (
            round(total_vested / total_granted * 100, 1)
            if total_granted > 0 else 0
        )

        return VsopSummary(
            pool=VsopPoolRead.model_validate(pool),
            grants=grants,
            total_granted=total_granted,
            total_available=total_available,
            total_vested=total_vested,
            total_unvested=total_unvested,
            pool_utilization_pct=pool_util,
            overall_vesting_pct=overall_vest,
        )
