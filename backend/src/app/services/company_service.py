from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import TYPE_CHECKING

logger = logging.getLogger(__name__)


_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def _parse_flexible_date(date_str: str) -> datetime | None:
    """Parse dates in various formats: ISO, YYYY-MM, YYYY, 'Month YYYY', 'Q1 2023'."""
    # Try ISO first (2023-06-15, 2023-06-15T00:00:00)
    try:
        return datetime.fromisoformat(date_str)
    except ValueError:
        pass

    # Try YYYY-MM (2023-06)
    match = re.match(r"^(\d{4})-(\d{2})$", date_str)
    if match:
        return datetime(int(match.group(1)), int(match.group(2)), 1)

    # Try YYYY only (2023)
    match = re.match(r"^(\d{4})$", date_str)
    if match:
        return datetime(int(match.group(1)), 1, 1)

    # Try "Month YYYY" or "Mon YYYY" (May 2023, January 2024)
    match = re.match(r"^(\w+)\s+(\d{4})$", date_str.strip(), re.IGNORECASE)
    if match:
        month_name = match.group(1).lower()
        year = int(match.group(2))
        if month_name in _MONTHS:
            return datetime(year, _MONTHS[month_name], 1)

    # Try "Q1 2023" style
    match = re.match(r"^Q(\d)\s+(\d{4})$", date_str.strip(), re.IGNORECASE)
    if match:
        quarter = int(match.group(1))
        year = int(match.group(2))
        month = (quarter - 1) * 3 + 1
        return datetime(year, month, 1)

    logger.warning("Could not parse funding date: %r", date_str)
    return None

from sqlalchemy import delete, insert, select
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

    async def delete_source(self, company_id: str, source_id: str) -> bool:
        """Delete a single data source, verifying it belongs to the company."""
        stmt = select(DataSource).where(
            DataSource.id == source_id,
            DataSource.company_id == company_id,
        )
        result = await self.session.execute(stmt)
        source = result.scalar_one_or_none()
        if not source:
            return False
        await self.session.delete(source)
        await self.session.commit()
        return True

    async def delete_social_post(self, company_id: str, post_id: str) -> bool:
        """Delete a single social post, verifying it belongs to the company."""
        from app.models.social_post import SocialPost

        stmt = select(SocialPost).where(
            SocialPost.id == post_id,
            SocialPost.company_id == company_id,
        )
        result = await self.session.execute(stmt)
        post = result.scalar_one_or_none()
        if not post:
            return False
        await self.session.delete(post)
        await self.session.commit()
        return True

    async def clear_enrichment_data(self, company_id: str) -> None:
        """Delete all enrichment child records for a company in FK-safe order.

        Preserves: the Company row itself, is_primary flag, custom sources.
        """
        from app.models.associations import company_categories, round_investors
        from app.models.company_digest import CompanyDigest
        from app.models.event import Event
        from app.models.social_post import SocialPost

        # 1. Delete round_investors associations first (FK depends on funding_rounds)
        rounds_stmt = select(FundingRound.id).where(
            FundingRound.company_id == company_id
        )
        round_ids = (await self.session.execute(rounds_stmt)).scalars().all()
        if round_ids:
            await self.session.execute(
                delete(round_investors).where(
                    round_investors.c.round_id.in_(round_ids)
                )
            )

        # 2. Delete company_categories associations
        await self.session.execute(
            delete(company_categories).where(
                company_categories.c.company_id == company_id
            )
        )

        # 3. Delete child records
        for model in [Founder, FundingRound, Product, Event, SocialPost, CompanyDigest]:
            await self.session.execute(
                delete(model).where(model.company_id == company_id)
            )

        # 4. Delete auto-discovered data sources only (keep custom)
        await self.session.execute(
            delete(DataSource).where(
                DataSource.company_id == company_id,
                DataSource.is_custom == False,
            )
        )

        # 5. Reset intelligence JSON fields on Company
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if company:
            company.media_tone = None
            company.posting_frequency = None
            company.top_topics = None
            company.positioning_summary = None
            company.gtm_strategy = None
            company.key_differentiators = None
            company.risk_signals = None
            company.icp_analysis = None
            company.geography_analysis = None
            company.industry_focus = None
            company.crosscheck_result = None

        await self.session.commit()

    async def clear_intelligence_data(self, company_id: str) -> None:
        """Delete AI-generated data but keep raw sources (DataSources + SocialPosts).

        For use in intelligence re-analysis where we want fresh AI output
        from the same source material.
        """
        from app.models.associations import company_categories, round_investors
        from app.models.company_digest import CompanyDigest
        from app.models.event import Event
        from app.models.competitor_client import CompetitorClient

        # 1. Delete round_investors associations
        rounds_stmt = select(FundingRound.id).where(
            FundingRound.company_id == company_id
        )
        round_ids = (await self.session.execute(rounds_stmt)).scalars().all()
        if round_ids:
            await self.session.execute(
                delete(round_investors).where(
                    round_investors.c.round_id.in_(round_ids)
                )
            )

        # 2. Delete company_categories associations
        await self.session.execute(
            delete(company_categories).where(
                company_categories.c.company_id == company_id
            )
        )

        # 3. Delete AI-generated child records (NOT DataSource, NOT SocialPost)
        for model in [Founder, FundingRound, Product, Event, CompanyDigest, CompetitorClient]:
            await self.session.execute(
                delete(model).where(model.company_id == company_id)
            )

        # 4. Reset intelligence JSON fields on Company
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if company:
            company.media_tone = None
            company.posting_frequency = None
            company.top_topics = None
            company.positioning_summary = None
            company.gtm_strategy = None
            company.key_differentiators = None
            company.risk_signals = None
            company.icp_analysis = None
            company.geography_analysis = None
            company.industry_focus = None
            company.crosscheck_result = None

        await self.session.commit()

    async def clear_digests(self, company_id: str) -> None:
        """Delete only CompanyDigest records (for rerun_with_sources)."""
        from app.models.company_digest import CompanyDigest

        await self.session.execute(
            delete(CompanyDigest).where(CompanyDigest.company_id == company_id)
        )
        await self.session.commit()

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
                selectinload(Company.social_posts),
                selectinload(Company.digests),
                selectinload(Company.competitor_clients),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self, skip: int = 0, limit: int = 50
    ) -> list[Company]:
        from app.models.event import Event

        stmt = (
            select(Company)
            .options(
                selectinload(Company.founders),
                selectinload(Company.events),
                selectinload(Company.funding_rounds),
            )
            .offset(skip)
            .limit(limit)
            .order_by(Company.created_at.desc())
        )
        result = await self.session.execute(stmt)
        companies = list(result.scalars().all())
        for c in companies:
            c.founder_count = len(c.founders) if c.founders else 0
            c.event_count = len(c.events) if c.events else 0
            c.funding_round_count = len(c.funding_rounds) if c.funding_rounds else 0
        return companies

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
        for source in context.sources:
            ds = DataSource(
                url=source.url,
                title=source.title,
                source_type="web",
                content_snippet=source.content[:500] if source.content else None,
                raw_content=source.content,
                raw_content_md=source.content_md if hasattr(source, 'content_md') else None,
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
            round_date = _parse_flexible_date(fr.date) if fr.date else None
            round_obj = FundingRound(
                round_name=fr.round_name,
                amount_usd=fr.amount_usd,
                date=round_date,
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

    async def apply_crosscheck(self, company_id: str, crosscheck) -> None:
        """Write validated crosscheck fields back to the company."""
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return
        if crosscheck.positioning_summary:
            company.positioning_summary = crosscheck.positioning_summary
        if crosscheck.gtm_strategy:
            company.gtm_strategy = crosscheck.gtm_strategy
        if crosscheck.key_differentiators:
            company.key_differentiators = json.dumps(crosscheck.key_differentiators)
        if crosscheck.risk_signals:
            company.risk_signals = json.dumps(crosscheck.risk_signals)
        if crosscheck.top_topics:
            company.top_topics = json.dumps(crosscheck.top_topics)
        # Store the full structured crosscheck for the Data Quality panel
        company.crosscheck_result = json.dumps({
            "confidence_score": crosscheck.confidence_score,
            "validated_facts": crosscheck.validated_facts,
            "contradictions": crosscheck.contradictions,
            "data_gaps": crosscheck.data_gaps,
            "recommendations": crosscheck.recommendations,
            "consolidated_summary": crosscheck.consolidated_summary,
        })
        await self.session.commit()

    async def update(self, company_id: str, data) -> "Company | None":
        """Partial update of company fields."""
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "social_handles" and isinstance(value, dict):
                setattr(company, field, json.dumps(value))
            else:
                setattr(company, field, value)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def set_primary(self, company_id: str) -> "Company | None":
        """Set one company as primary, unset all others."""
        # Unset all
        all_stmt = select(Company).where(Company.is_primary == True)
        result = await self.session.execute(all_stmt)
        for c in result.scalars().all():
            c.is_primary = False
        # Set this one
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            return None
        company.is_primary = True
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def get_primary(self) -> "Company | None":
        """Get the primary company."""
        stmt = select(Company).where(Company.is_primary == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def store_social_posts(
        self, company_id: str, results: list, platform: str
    ) -> None:
        """Store social search results as SocialPost records."""
        from app.models.social_post import SocialPost
        for r in results:
            post = SocialPost(
                platform=platform,
                content=r.snippet[:1000] if hasattr(r, 'snippet') and r.snippet else None,
                url=r.url if hasattr(r, 'url') else str(r),
                company_id=company_id,
            )
            self.session.add(post)
        await self.session.commit()

    async def add_custom_source(
        self,
        company_id: str,
        url: str,
        title: str,
        content: str,
        content_md: str,
    ) -> "DataSource":
        """Add a user-provided URL as a custom data source."""
        ds = DataSource(
            url=url,
            title=title,
            source_type="web",
            content_snippet=content[:500] if content else None,
            raw_content=content,
            raw_content_md=content_md,
            is_custom=True,
            last_fetched=datetime.now(timezone.utc),
            company_id=company_id,
        )
        self.session.add(ds)
        await self.session.commit()
        await self.session.refresh(ds)
        return ds

    async def get_comparison_data(self, company_ids: list[str]) -> list["Company"]:
        """Load multiple companies with all relations for comparison."""
        from app.models.funding_round import FundingRound
        stmt = (
            select(Company)
            .where(Company.id.in_(company_ids))
            .options(
                selectinload(Company.founders),
                selectinload(Company.funding_rounds).selectinload(
                    FundingRound.investors
                ),
                selectinload(Company.events),
                selectinload(Company.categories),
                selectinload(Company.products),
                selectinload(Company.data_sources),
                selectinload(Company.social_posts),
                selectinload(Company.digests),
                selectinload(Company.competitor_clients),
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def apply_product_features(self, company_id: str, features_result) -> None:
        """Store extracted product features on Product records."""
        import json as _json
        from app.models.product import Product
        for pf in features_result.products:
            # Try to match existing product by name
            stmt = select(Product).where(
                Product.company_id == company_id,
                Product.name == pf.product_name,
            )
            result = await self.session.execute(stmt)
            product = result.scalar_one_or_none()
            if product:
                product.features = _json.dumps(pf.features)
                if pf.description and not product.description:
                    product.description = pf.description
            else:
                product = Product(
                    name=pf.product_name,
                    description=pf.description,
                    features=_json.dumps(pf.features),
                    company_id=company_id,
                )
                self.session.add(product)
        await self.session.commit()

    async def store_digest(
        self, company_id: str, markdown: str, digest_type: str
    ) -> None:
        """Store a generated digest."""
        from app.models.company_digest import CompanyDigest
        digest = CompanyDigest(
            digest_markdown=markdown,
            digest_type=digest_type,
            company_id=company_id,
        )
        self.session.add(digest)
        await self.session.commit()

    async def apply_client_intelligence(
        self, company_id: str, result
    ) -> None:
        """Store client intelligence results: clients as rows, ICP/geo/industry as JSON."""
        from app.models.competitor_client import CompetitorClient

        for c in result.clients:
            client = CompetitorClient(
                client_name=c.client_name,
                client_domain=c.client_domain,
                industry=c.industry,
                region=c.region,
                company_size=c.company_size,
                relationship_type=c.relationship_type,
                confidence=c.confidence,
                company_id=company_id,
            )
            self.session.add(client)

        # Store analysis as JSON fields on the company
        stmt = select(Company).where(Company.id == company_id)
        result_row = await self.session.execute(stmt)
        company = result_row.scalar_one_or_none()
        if company:
            company.icp_analysis = json.dumps(result.icp.model_dump())
            company.geography_analysis = json.dumps(result.geography.model_dump())
            company.industry_focus = json.dumps(result.industry.model_dump())

        await self.session.commit()

    async def get_competitor_clients(self, company_id: str) -> list:
        """Fetch all competitor clients for a company."""
        from app.models.competitor_client import CompetitorClient

        stmt = select(CompetitorClient).where(
            CompetitorClient.company_id == company_id
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_competitor_clients(
        self, company_ids: list[str]
    ) -> dict[str, list]:
        """Fetch competitor clients across multiple companies, keyed by company_id."""
        from app.models.competitor_client import CompetitorClient

        stmt = select(CompetitorClient).where(
            CompetitorClient.company_id.in_(company_ids)
        )
        result = await self.session.execute(stmt)
        clients = result.scalars().all()
        grouped: dict[str, list] = {}
        for c in clients:
            grouped.setdefault(c.company_id, []).append(c)
        return grouped

    # ── Versioning / Snapshots ──────────────────────────────────

    async def create_snapshot(self, company_id: str) -> int:
        """Snapshot the current company state and increment data_version."""
        from app.models.enrichment_snapshot import EnrichmentSnapshot

        company = await self.get_by_id(company_id)
        if not company:
            return 0

        snapshot_data = {
            "name": company.name,
            "domain": company.domain,
            "description": company.description,
            "one_liner": company.one_liner,
            "stage": company.stage,
            "hq_location": company.hq_location,
            "employee_range": company.employee_range,
            "positioning_summary": company.positioning_summary,
            "gtm_strategy": company.gtm_strategy,
            "key_differentiators": company.key_differentiators,
            "risk_signals": company.risk_signals,
            "top_topics": company.top_topics,
            "media_tone": company.media_tone,
            "icp_analysis": company.icp_analysis,
            "geography_analysis": company.geography_analysis,
            "industry_focus": company.industry_focus,
            "crosscheck_result": company.crosscheck_result,
            "founders": [
                {"name": f.name, "title": f.title}
                for f in (company.founders or [])
            ],
            "funding_rounds": [
                {
                    "round_name": r.round_name,
                    "amount_usd": r.amount_usd,
                    "date": r.date.isoformat() if r.date else None,
                }
                for r in (company.funding_rounds or [])
            ],
            "products": [
                {"name": p.name, "features": p.features}
                for p in (company.products or [])
            ],
            "events_count": len(company.events) if company.events else 0,
            "clients": [
                {"client_name": c.client_name, "industry": c.industry}
                for c in (company.competitor_clients or [])
            ],
            "sources_count": len(company.data_sources) if company.data_sources else 0,
        }

        new_version = (company.data_version or 0) + 1

        snapshot = EnrichmentSnapshot(
            company_id=company_id,
            version=new_version,
            snapshot_data=json.dumps(snapshot_data),
        )
        self.session.add(snapshot)

        # Update company version
        stmt = select(Company).where(Company.id == company_id)
        result = await self.session.execute(stmt)
        co = result.scalar_one_or_none()
        if co:
            co.data_version = new_version
            co.last_enriched_at = datetime.now(timezone.utc)

        await self.session.commit()
        return new_version

    async def get_snapshots(self, company_id: str) -> list:
        """Get all enrichment snapshots for a company, ordered by version desc."""
        from app.models.enrichment_snapshot import EnrichmentSnapshot

        stmt = (
            select(EnrichmentSnapshot)
            .where(EnrichmentSnapshot.company_id == company_id)
            .order_by(EnrichmentSnapshot.version.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
