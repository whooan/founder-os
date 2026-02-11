import logging

from app.database import async_session_factory
from app.intelligence.pipelines.discovery import run_discovery
from app.intelligence.pipelines.event_extraction import run_event_extraction
from app.intelligence.pipelines.market_intel import run_market_intel
from app.intelligence.pipelines.media_fingerprint import run_media_fingerprint
from app.intelligence.research import research_company
from app.services.company_service import CompanyService

logger = logging.getLogger(__name__)


async def run_full_enrichment(company_id: str) -> None:
    """Run all intelligence pipelines for a company. Called as a background task."""
    async with async_session_factory() as session:
        service = CompanyService(session)
        company = await service.get_by_id(company_id)
        if not company:
            logger.error(f"Company {company_id} not found for enrichment")
            return

        company_name = company.name

        try:
            await service.set_status(company_id, "running")

            # Step 1: Web research — search + fetch + extract real content
            logger.info(f"Researching '{company_name}' on the web...")
            research_context = await research_company(company_name)
            logger.info(
                f"Research complete: {len(research_context.sources)} sources, "
                f"{len(research_context.combined_text)} chars"
            )

            # Step 2: Store all research sources in the database
            await service.store_research_sources(company_id, research_context)

            # Step 3: Run all 4 pipelines with real research context
            logger.info(f"Running discovery pipeline for {company_name}")
            discovery = await run_discovery(company_name, research_context)
            await service.apply_discovery(company_id, discovery)

            logger.info(f"Running media fingerprint pipeline for {company_name}")
            fingerprint = await run_media_fingerprint(company_name, research_context)
            await service.apply_media_fingerprint(company_id, fingerprint)

            logger.info(f"Running event extraction pipeline for {company_name}")
            events = await run_event_extraction(company_name, research_context)
            await service.apply_events(company_id, events)

            logger.info(f"Running market intelligence pipeline for {company_name}")
            intel = await run_market_intel(company_name, research_context)
            await service.apply_market_intel(company_id, intel)

            await service.set_status(company_id, "enriched")
            logger.info(f"Enrichment complete for {company_name}")

        except Exception as e:
            logger.exception(f"Pipeline failed for {company_name}: {e}")
            async with async_session_factory() as error_session:
                error_service = CompanyService(error_session)
                await error_service.set_status(company_id, "error")
