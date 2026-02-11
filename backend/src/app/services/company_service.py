from __future__ import annotations

import json
from typing import TYPE_CHECKING

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.associations import round_investors
from app.models.company import Company
from app.models.data_source import DataSource
from app.models.founder import Founder
from app.models.funding_round import FundingRound
from app.models.investor import Investor
from app.models.market_category import MarketCategory
from app.models.product import Product
from app.schemas.company import CompanyCreate

if TYPE_CHECKING:
    from app.intelligence.research import ResearchContext
    from app.intelligence.schemas import (
        CompanyDiscoveryResult,
        EventExtractionResult,
        MarketIntelligence,
        MediaFingerprint,
    )


class CompanyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: CompanyCreate) -> Company:
        company = Company(name=data.name)
        self.session.add(company)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def delete(self, company_id: str) -> bool:
        company = await self.get_by_id(company_id)
        if not company:
            return False
        await self.session.delete(company)
        await self.session.commit()
        return True

    async def get_by_id(self, company_id: str) -> Company | None:
        stmt = (
            select(Company)
            .where(Company.id == company_id)
            .options(
                selectinload(Company.founders),
                selectinload(Company.funding_rounds).selectinload(
                    FundingRound.investors
                ),
                selectinload(Company.events),
                selectinload(Company.categories),
                selectinload(Company.products),
                selectinload(Company.data_sources),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self, skip: int = 0, limit: int = 50
    ) -> list[Company]:
        stmt = (
            select(Company)
            .offset(skip)
            .limit(limit)
            .order_by(Company.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def search(self, query: str) -> list[Company]:
        stmt = select(Company).where(Company.name.ilike(f"%{query}%"))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_status(self, company_id: str) -> str:
        stmt = select(Company.status).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        status = result.scalar_one_or_none()
        return status or "not_found"

    async def set_status(self, company_id: str, status: str) -> None:
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if company:
            company.status = status
            await self.session.commit()

    async def store_research_sources(
        self, company_id: str, context: ResearchContext
    ) -> None:
        """Store all web research sources in the database for traceability."""
        from datetime import datetime, timezone

        for source in context.sources:
            ds = DataSource(
                url=source.url,
                title=source.title,
                source_type="web",
                content_snippet=source.content[:500] if source.content else None,
                raw_content=source.content,
                last_fetched=source.fetch_date
                if source.fetch_date
                else datetime.now(timezone.utc),
                company_id=company_id,
            )
            self.session.add(ds)
        await self.session.commit()

    async def apply_discovery(
        self, company_id: str, discovery: CompanyDiscoveryResult
    ) -> None:
        stmt = (
            select(Company)
            .where(Company.id == company_id)
            .options(selectinload(Company.categories))
        )
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return

        company.domain = discovery.domain
        company.description = discovery.description
        company.one_liner = discovery.one_liner
        company.founded_year = discovery.founded_year
        company.hq_location = discovery.hq_location
        company.employee_range = discovery.employee_range
        company.stage = discovery.stage

        # Add founders
        for f in discovery.founders:
            founder = Founder(
                name=f.name,
                title=f.title,
                linkedin_url=f.linkedin_url,
                twitter_handle=f.twitter_handle,
                bio=f.bio,
                previous_companies=json.dumps(f.previous_companies)
                if f.previous_companies
                else None,
                company_id=company_id,
            )
            self.session.add(founder)

        # Add funding rounds with investors
        for fr in discovery.funding_rounds:
            round_obj = FundingRound(
                round_name=fr.round_name,
                amount_usd=fr.amount_usd,
                company_id=company_id,
            )
            self.session.add(round_obj)
            await self.session.flush()

            for inv_name in fr.investors:
                # Find or create investor
                inv_stmt = select(Investor).where(Investor.name == inv_name)
                inv_result = await self.session.execute(inv_stmt)
                investor = inv_result.scalar_one_or_none()
                if not investor:
                    investor = Investor(name=inv_name, type="vc")
                    self.session.add(investor)
                    await self.session.flush()
                await self.session.execute(
                    insert(round_investors).values(
                        round_id=round_obj.id, investor_id=investor.id
                    )
                )

        # Add products
        for prod_name in discovery.products:
            product = Product(
                name=prod_name,
                company_id=company_id,
            )
            self.session.add(product)

        # Add market categories
        for cat_name in discovery.market_categories:
            cat_stmt = select(MarketCategory).where(
                MarketCategory.name == cat_name
            )
            cat_result = await self.session.execute(cat_stmt)
            category = cat_result.scalar_one_or_none()
            if not category:
                category = MarketCategory(name=cat_name)
                self.session.add(category)
                await self.session.flush()
            if category not in company.categories:
                company.categories.append(category)

        await self.session.commit()

    async def apply_media_fingerprint(
        self, company_id: str, fingerprint: MediaFingerprint
    ) -> None:
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return

        company.media_tone = json.dumps(
            {
                "tone": fingerprint.tone,
                "content_style": fingerprint.content_style,
                "audience_engagement": fingerprint.audience_engagement,
            }
        )
        company.posting_frequency = fingerprint.posting_frequency
        company.top_topics = json.dumps(fingerprint.top_topics)
        await self.session.commit()

    async def apply_events(
        self, company_id: str, extraction: EventExtractionResult
    ) -> None:
        from app.models.event import Event

        for e in extraction.events:
            from datetime import datetime

            event_date = None
            if e.event_date:
                try:
                    event_date = datetime.fromisoformat(e.event_date)
                except ValueError:
                    pass

            event = Event(
                title=e.title,
                description=e.description,
                event_type=e.event_type,
                event_date=event_date,
                source_url=e.source_url,
                sentiment=e.sentiment,
                significance=e.significance,
                company_id=company_id,
            )
            self.session.add(event)

        await self.session.commit()

    async def apply_market_intel(
        self, company_id: str, intel: MarketIntelligence
    ) -> None:
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return

        company.positioning_summary = intel.positioning_summary
        company.gtm_strategy = intel.gtm_strategy
        company.key_differentiators = json.dumps(intel.key_differentiators)
        company.risk_signals = json.dumps(intel.risk_signals)
        await self.session.commit()
