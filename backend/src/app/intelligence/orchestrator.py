"""Pipeline orchestration: research -> store -> enrich -> digest."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.intelligence.pipelines.company_digest import run_company_digest
from app.intelligence.pipelines.crosscheck import run_crosscheck
from app.intelligence.pipelines.discovery import run_discovery
from app.intelligence.pipelines.event_extraction import run_event_extraction
from app.intelligence.pipelines.market_intel import run_market_intel
from app.intelligence.pipelines.media_fingerprint import run_media_fingerprint
from app.intelligence.pipelines.product_features import run_product_features
from app.intelligence.pipelines.social_digest import run_social_digest
from app.intelligence.research import (
    ResearchContext,
    SearchResult,
    SourceDocument,
    fetch_and_extract,
    research_company_full,
)
from app.models.company import Company
from app.models.company_digest import CompanyDigest
from app.models.data_source import DataSource
from app.models.social_post import SocialPost
from app.services.company_service import CompanyService

logger = logging.getLogger(__name__)


async def run_full_enrichment(company_id: str) -> None:
    """Full enrichment pipeline: research + all AI pipelines + digest."""
    async with async_session() as session:
        service = CompanyService(session)
        company = await service.get_by_id(company_id)
        if not company:
            logger.error("Company %s not found", company_id)
            return

        company_name = company.name

        # Clear previous enrichment data to prevent duplicates on re-run
        logger.info("Clearing previous enrichment data for %s ...", company_name)
        await service.clear_enrichment_data(company_id)

        await service.set_status(company_id, "running")

        try:
            # -- Step 1: Gather existing founder info for social search --
            founder_names = [f.name for f in company.founders] if company.founders else []
            social_handles: dict[str, str] = {}
            if company.social_handles:
                try:
                    social_handles = json.loads(company.social_handles) if isinstance(company.social_handles, str) else company.social_handles
                except (json.JSONDecodeError, TypeError):
                    pass

            # -- Step 2: Full web + social research --
            logger.info("Researching %s ...", company_name)
            web_context, linkedin_results, twitter_results, hn_results = (
                await research_company_full(
                    company_name, founder_names, social_handles
                )
            )

            # -- Step 3: Store web sources with markdown --
            await service.store_research_sources(company_id, web_context)

            # -- Step 4: Store social search results as SocialPost records --
            await _store_social_results(session, company_id, "linkedin", linkedin_results)
            await _store_social_results(session, company_id, "twitter", twitter_results)
            await _store_social_results(session, company_id, "hackernews", hn_results)

            # -- Step 5: Run existing 4 pipelines --
            logger.info("Running discovery pipeline for %s ...", company_name)
            discovery = await run_discovery(company_name, web_context)
            await service.apply_discovery(company_id, discovery)

            # Re-gather founder names after discovery populated them
            company = await service.get_by_id(company_id)
            if company and company.founders:
                founder_names = [f.name for f in company.founders]

            logger.info("Running media fingerprint for %s ...", company_name)
            fingerprint = await run_media_fingerprint(company_name, web_context)
            await service.apply_media_fingerprint(company_id, fingerprint)

            logger.info("Running event extraction for %s ...", company_name)
            events = await run_event_extraction(company_name, web_context)
            await service.apply_events(company_id, events)

            logger.info("Running market intel for %s ...", company_name)
            intel = await run_market_intel(company_name, web_context)
            await service.apply_market_intel(company_id, intel)

            # -- Step 5b: Client Intelligence pipeline --
            logger.info("Running client intelligence for %s ...", company_name)
            from app.intelligence.pipelines.client_intelligence import run_client_intelligence
            client_intel = await run_client_intelligence(company_name, web_context)
            await service.apply_client_intelligence(company_id, client_intel)

            # -- Step 6: Product features pipeline --
            logger.info("Running product features extraction for %s ...", company_name)
            features_result = await run_product_features(company_name, web_context)
            await service.apply_product_features(company_id, features_result)

            # -- Step 7: Social digest pipeline --
            social_content = _build_social_content(
                linkedin_results, twitter_results, hn_results
            )
            if social_content.strip():
                logger.info("Running social digest for %s ...", company_name)
                social_digest_result = await run_social_digest(
                    company_name, social_content
                )
                social_md = _social_digest_to_markdown(social_digest_result)
                await service.store_digest(company_id, social_md, "social")

            # -- Step 8: Company digest (GPT-4.1, cross-references ALL data) --
            logger.info("Running company digest for %s ...", company_name)
            company = await service.get_by_id(company_id)
            all_context = _build_full_context(company, web_context) if company else ""
            if all_context.strip():
                digest_result = await run_company_digest(company_name, all_context)
                full_md = _digest_to_markdown(digest_result)
                await service.store_digest(company_id, full_md, "full")

            # -- Step 9: 360° Crosscheck (final validation) --
            logger.info("Running 360° crosscheck for %s ...", company_name)
            if all_context.strip():
                crosscheck_result = await run_crosscheck(company_name, all_context)
                crosscheck_md = _crosscheck_to_markdown(crosscheck_result)
                await service.store_digest(company_id, crosscheck_md, "crosscheck")
                await service.apply_crosscheck(company_id, crosscheck_result)

            await service.set_status(company_id, "enriched")
            logger.info("Enrichment complete for %s", company_name)

        except Exception:
            logger.exception("Enrichment failed for %s", company_name)
            await service.set_status(company_id, "error")


async def rerun_with_sources(company_id: str) -> None:
    """Re-run digest pipeline using all existing + custom sources."""
    async with async_session() as session:
        service = CompanyService(session)
        company = await service.get_by_id(company_id)
        if not company:
            logger.error("Company %s not found for rerun", company_id)
            return

        # Clear previous digests before rerunning
        await service.clear_digests(company_id)

        await service.set_status(company_id, "running")
        try:
            # Build context from all stored data sources
            source_texts = []
            for ds in company.data_sources:
                header = f"[Source: {ds.title or ds.url}]\nURL: {ds.url}\n"
                content = ds.raw_content or ds.content_snippet or ""
                if content:
                    source_texts.append(header + content[:5000])

            # Build social context
            social_texts = []
            for post in company.social_posts:
                social_texts.append(
                    f"[{post.platform}] {post.author or 'Unknown'}: "
                    f"{post.content or post.url}"
                )

            # Build full context
            web_text = "\n\n---\n\n".join(source_texts)
            social_text = "\n".join(social_texts)

            all_context = _build_full_context_from_company(company, web_text, social_text)

            if all_context.strip():
                logger.info("Re-running digest for %s ...", company.name)
                digest_result = await run_company_digest(company.name, all_context)
                full_md = _digest_to_markdown(digest_result)
                await service.store_digest(company_id, full_md, "full")

                # 360° Crosscheck
                logger.info("Running 360° crosscheck for %s ...", company.name)
                crosscheck_result = await run_crosscheck(company.name, all_context)
                crosscheck_md = _crosscheck_to_markdown(crosscheck_result)
                await service.store_digest(company_id, crosscheck_md, "crosscheck")
                await service.apply_crosscheck(company_id, crosscheck_result)

            await service.set_status(company_id, "enriched")
            logger.info("Rerun complete for %s", company.name)

        except Exception:
            logger.exception("Rerun failed for company %s", company_id)
            await service.set_status(company_id, "error")


async def run_incremental_update(company_id: str) -> None:
    """Incremental update: fetch new sources only, compare with existing, re-run digests."""
    async with async_session() as session:
        service = CompanyService(session)
        company = await service.get_by_id(company_id)
        if not company:
            logger.error("Company %s not found for incremental update", company_id)
            return

        company_name = company.name
        await service.set_status(company_id, "running")

        try:
            # Step 1: Gather existing URLs to avoid duplicates
            existing_source_urls = {ds.url for ds in company.data_sources}
            existing_social_urls = {p.url for p in company.social_posts if p.url}

            # Step 2: Gather founder info and social handles
            founder_names = [f.name for f in company.founders] if company.founders else []
            social_handles: dict[str, str] = {}
            if company.social_handles:
                try:
                    social_handles = (
                        json.loads(company.social_handles)
                        if isinstance(company.social_handles, str)
                        else company.social_handles
                    )
                except (json.JSONDecodeError, TypeError):
                    pass

            # Step 3: Run new web + social research
            logger.info("Incremental research for %s ...", company_name)
            web_context, linkedin_results, twitter_results, hn_results = (
                await research_company_full(
                    company_name, founder_names, social_handles
                )
            )

            # Step 4: Filter to only NEW web sources (by URL)
            new_sources = [
                src for src in web_context.sources
                if src.url not in existing_source_urls
            ]
            if new_sources:
                logger.info("Found %d new web sources for %s", len(new_sources), company_name)
                new_context = ResearchContext(sources=new_sources)
                await service.store_research_sources(company_id, new_context)

            # Step 5: Filter to only NEW social posts (by URL)
            new_linkedin = [r for r in linkedin_results if r.url not in existing_social_urls]
            new_twitter = [r for r in twitter_results if r.url not in existing_social_urls]
            new_hn = [r for r in hn_results if r.url not in existing_social_urls]

            if new_linkedin:
                await _store_social_results(session, company_id, "linkedin", new_linkedin)
            if new_twitter:
                await _store_social_results(session, company_id, "twitter", new_twitter)
            if new_hn:
                await _store_social_results(session, company_id, "hackernews", new_hn)

            new_source_count = len(new_sources)
            new_social_count = len(new_linkedin) + len(new_twitter) + len(new_hn)
            logger.info(
                "Found %d new web sources and %d new social posts for %s",
                new_source_count, new_social_count, company_name,
            )

            # Step 6: If new data found, re-run digests with ALL data (old + new)
            if new_source_count > 0 or new_social_count > 0:
                await service.clear_digests(company_id)

                # Reload company with all data
                company = await service.get_by_id(company_id)
                if company:
                    source_texts = []
                    for ds in company.data_sources:
                        header = f"[Source: {ds.title or ds.url}]\nURL: {ds.url}\n"
                        content = ds.raw_content or ds.content_snippet or ""
                        if content:
                            source_texts.append(header + content[:5000])

                    social_texts = []
                    for post in company.social_posts:
                        social_texts.append(
                            f"[{post.platform}] {post.author or 'Unknown'}: "
                            f"{post.content or post.url}"
                        )

                    web_text = "\n\n---\n\n".join(source_texts)
                    social_text = "\n".join(social_texts)

                    # Social digest
                    if social_text.strip():
                        logger.info("Re-running social digest for %s ...", company_name)
                        social_digest_result = await run_social_digest(
                            company_name, social_text
                        )
                        social_md = _social_digest_to_markdown(social_digest_result)
                        await service.store_digest(company_id, social_md, "social")

                    # Full company digest
                    all_context = _build_full_context_from_company(
                        company, web_text, social_text
                    )
                    if all_context.strip():
                        logger.info("Re-running company digest for %s ...", company_name)
                        digest_result = await run_company_digest(
                            company_name, all_context
                        )
                        full_md = _digest_to_markdown(digest_result)
                        await service.store_digest(company_id, full_md, "full")

                        # 360° Crosscheck
                        logger.info("Running 360° crosscheck for %s ...", company_name)
                        crosscheck_result = await run_crosscheck(company_name, all_context)
                        crosscheck_md = _crosscheck_to_markdown(crosscheck_result)
                        await service.store_digest(company_id, crosscheck_md, "crosscheck")
                        await service.apply_crosscheck(company_id, crosscheck_result)
            else:
                logger.info("No new data found for %s, skipping digest rerun", company_name)

            await service.set_status(company_id, "enriched")
            logger.info("Incremental update complete for %s", company_name)

        except Exception:
            logger.exception("Incremental update failed for %s", company_name)
            await service.set_status(company_id, "error")


async def run_intelligence_rerun(company_id: str) -> None:
    """Re-run ALL AI pipelines using existing stored sources. No new data collection."""
    async with async_session() as session:
        service = CompanyService(session)
        company = await service.get_by_id(company_id)
        if not company:
            logger.error("Company %s not found for intelligence rerun", company_id)
            return

        company_name = company.name

        # Build context from stored data BEFORE clearing intelligence
        web_context = _build_research_context_from_stored(company)
        social_content = _build_social_content_from_stored(company)

        # Clear AI-generated data but keep raw sources
        logger.info("Clearing intelligence data for %s ...", company_name)
        await service.clear_intelligence_data(company_id)

        await service.set_status(company_id, "running")
        try:
            # -- Run all 6 AI pipelines --
            logger.info("Re-running discovery for %s ...", company_name)
            discovery = await run_discovery(company_name, web_context)
            await service.apply_discovery(company_id, discovery)

            company = await service.get_by_id(company_id)

            logger.info("Re-running media fingerprint for %s ...", company_name)
            fingerprint = await run_media_fingerprint(company_name, web_context)
            await service.apply_media_fingerprint(company_id, fingerprint)

            logger.info("Re-running event extraction for %s ...", company_name)
            events = await run_event_extraction(company_name, web_context)
            await service.apply_events(company_id, events)

            logger.info("Re-running market intel for %s ...", company_name)
            intel = await run_market_intel(company_name, web_context)
            await service.apply_market_intel(company_id, intel)

            logger.info("Re-running client intelligence for %s ...", company_name)
            from app.intelligence.pipelines.client_intelligence import run_client_intelligence
            client_intel = await run_client_intelligence(company_name, web_context)
            await service.apply_client_intelligence(company_id, client_intel)

            logger.info("Re-running product features for %s ...", company_name)
            features_result = await run_product_features(company_name, web_context)
            await service.apply_product_features(company_id, features_result)

            # -- Social digest --
            if social_content.strip():
                logger.info("Re-running social digest for %s ...", company_name)
                social_digest_result = await run_social_digest(company_name, social_content)
                social_md = _social_digest_to_markdown(social_digest_result)
                await service.store_digest(company_id, social_md, "social")

            # -- Company digest --
            logger.info("Re-running company digest for %s ...", company_name)
            company = await service.get_by_id(company_id)
            all_context = _build_full_context(company, web_context) if company else ""
            if all_context.strip():
                digest_result = await run_company_digest(company_name, all_context)
                full_md = _digest_to_markdown(digest_result)
                await service.store_digest(company_id, full_md, "full")

            # -- 360° Crosscheck --
            logger.info("Running 360° crosscheck for %s ...", company_name)
            if all_context.strip():
                crosscheck_result = await run_crosscheck(company_name, all_context)
                crosscheck_md = _crosscheck_to_markdown(crosscheck_result)
                await service.store_digest(company_id, crosscheck_md, "crosscheck")
                await service.apply_crosscheck(company_id, crosscheck_result)

            await service.set_status(company_id, "enriched")
            logger.info("Intelligence rerun complete for %s", company_name)

        except Exception:
            logger.exception("Intelligence rerun failed for %s", company_name)
            await service.set_status(company_id, "error")


# -- Helper functions ----------------------------------------------------------


async def _store_social_results(
    session, company_id: str, platform: str, results: list[SearchResult]
) -> None:
    """Store social search results as SocialPost records."""
    for r in results:
        post = SocialPost(
            platform=platform,
            author=None,
            content=r.snippet[:1000] if r.snippet else None,
            url=r.url,
            posted_at=None,
            raw_content_md=None,
            company_id=company_id,
        )
        session.add(post)
    await session.commit()


def _build_social_content(
    linkedin: list[SearchResult],
    twitter: list[SearchResult],
    hn: list[SearchResult],
) -> str:
    """Build combined social content string for the social digest pipeline."""
    parts = []
    if linkedin:
        parts.append("=== LINKEDIN ===")
        for r in linkedin:
            parts.append(f"Title: {r.title}\nURL: {r.url}\nSnippet: {r.snippet}\n")
    if twitter:
        parts.append("=== TWITTER / X ===")
        for r in twitter:
            parts.append(f"Title: {r.title}\nURL: {r.url}\nSnippet: {r.snippet}\n")
    if hn:
        parts.append("=== HACKER NEWS ===")
        for r in hn:
            parts.append(f"Title: {r.title}\nURL: {r.url}\nSnippet: {r.snippet}\n")
    return "\n".join(parts)


def _build_research_context_from_stored(company: Company) -> ResearchContext:
    """Build a ResearchContext from stored DataSource records."""
    sources = []
    for ds in company.data_sources:
        content = ds.raw_content or ds.content_snippet or ""
        if content:
            sources.append(SourceDocument(
                url=ds.url,
                title=ds.title or ds.url,
                content=content[:5000],
                content_md=ds.raw_content_md or "",
                fetch_date=ds.last_fetched or datetime.now(timezone.utc),
            ))
    return ResearchContext(sources=sources)


def _build_social_content_from_stored(company: Company) -> str:
    """Build social content string from stored SocialPost records."""
    platform_groups: dict[str, list] = {}
    for post in company.social_posts:
        platform_groups.setdefault(post.platform, []).append(post)

    parts = []
    platform_labels = {"linkedin": "LINKEDIN", "twitter": "TWITTER / X", "hackernews": "HACKER NEWS"}
    for platform, posts in platform_groups.items():
        label = platform_labels.get(platform, platform.upper())
        parts.append(f"=== {label} ===")
        for post in posts:
            content = post.content or post.url or ""
            parts.append(
                f"Author: {post.author or 'Unknown'}\n"
                f"URL: {post.url}\n"
                f"Content: {content}\n"
            )
    return "\n".join(parts)


def _build_full_context(company: Company, web_context: ResearchContext) -> str:
    """Build comprehensive context for the company digest pipeline."""
    parts = []

    # Company profile
    parts.append(f"# Company: {company.name}")
    if company.description:
        parts.append(f"Description: {company.description}")
    if company.one_liner:
        parts.append(f"One-liner: {company.one_liner}")
    if company.stage:
        parts.append(f"Stage: {company.stage}")
    if company.hq_location:
        parts.append(f"HQ: {company.hq_location}")

    # Founders
    if company.founders:
        parts.append("\n## Founders")
        for f in company.founders:
            line = f"- {f.name}"
            if f.title:
                line += f" ({f.title})"
            if f.bio:
                line += f": {f.bio}"
            parts.append(line)

    # Funding
    if company.funding_rounds:
        parts.append("\n## Funding Rounds")
        for r in company.funding_rounds:
            amount = f"${r.amount_usd:,.0f}" if r.amount_usd else "Undisclosed"
            date_str = r.date.strftime("%Y-%m-%d") if r.date else "Unknown date"
            investors = ", ".join(inv.name for inv in r.investors) if r.investors else "Unknown"
            parts.append(f"- {r.round_name}: {amount} on {date_str} ({investors})")

    # Products & features
    if company.products:
        parts.append("\n## Products")
        for p in company.products:
            parts.append(f"- {p.name}")
            if p.features:
                try:
                    feats = json.loads(p.features) if isinstance(p.features, str) else p.features
                    for feat in feats:
                        parts.append(f"  * {feat}")
                except (json.JSONDecodeError, TypeError):
                    pass

    # Events
    if company.events:
        parts.append("\n## Recent Events")
        for e in sorted(company.events, key=lambda x: x.event_date or datetime.min, reverse=True)[:15]:
            parts.append(f"- [{e.event_type}] {e.title}")
            if e.description:
                parts.append(f"  {e.description[:200]}")
            if e.source_url:
                parts.append(f"  Source: {e.source_url}")

    # Intelligence
    if company.positioning_summary:
        parts.append(f"\n## Positioning\n{company.positioning_summary}")
    if company.gtm_strategy:
        parts.append(f"\n## GTM Strategy\n{company.gtm_strategy}")

    # Web sources
    parts.append("\n## Web Research Sources")
    parts.append(web_context.combined_text[:30000])

    # Social posts
    if company.social_posts:
        parts.append("\n## Social Media Activity")
        for post in company.social_posts[:20]:
            parts.append(f"[{post.platform}] {post.content or post.url}")

    return "\n".join(parts)


def _build_full_context_from_company(
    company: Company, web_text: str, social_text: str
) -> str:
    """Build context for rerun from stored data only (no ResearchContext)."""
    parts = []
    parts.append(f"# Company: {company.name}")
    if company.description:
        parts.append(f"Description: {company.description}")
    if company.one_liner:
        parts.append(f"One-liner: {company.one_liner}")
    if company.stage:
        parts.append(f"Stage: {company.stage}")

    if company.founders:
        parts.append("\n## Founders")
        for f in company.founders:
            line = f"- {f.name}"
            if f.title:
                line += f" ({f.title})"
            parts.append(line)

    if company.funding_rounds:
        parts.append("\n## Funding")
        for r in company.funding_rounds:
            amount = f"${r.amount_usd:,.0f}" if r.amount_usd else "Undisclosed"
            date_str = r.date.strftime("%Y-%m-%d") if r.date else "Unknown date"
            investors = ", ".join(inv.name for inv in r.investors) if r.investors else ""
            line = f"- {r.round_name}: {amount} on {date_str}"
            if investors:
                line += f" ({investors})"
            parts.append(line)

    if company.products:
        parts.append("\n## Products")
        for p in company.products:
            parts.append(f"- {p.name}")

    if company.events:
        parts.append("\n## Events")
        for e in company.events[:15]:
            parts.append(f"- [{e.event_type}] {e.title}")

    if web_text:
        parts.append(f"\n## Web Sources\n{web_text[:30000]}")
    if social_text:
        parts.append(f"\n## Social Media\n{social_text[:10000]}")

    return "\n".join(parts)


def _social_digest_to_markdown(digest) -> str:
    """Convert a SocialDigestResult to formatted markdown."""
    parts = [f"# Social Media Digest\n\n{digest.summary}"]

    parts.append(f"\n**Sentiment:** {digest.sentiment}")
    parts.append(f"**Activity Level:** {digest.activity_level}")

    if digest.key_themes:
        parts.append("\n## Key Themes")
        for theme in digest.key_themes:
            parts.append(f"- {theme}")

    if digest.notable_posts:
        parts.append("\n## Notable Posts")
        for post in digest.notable_posts:
            parts.append(f"- {post}")

    return "\n".join(parts)


def _digest_to_markdown(digest_result) -> str:
    """Convert a CompanyDigestResult to formatted markdown."""
    parts = [f"# Executive Summary\n\n{digest_result.executive_summary}"]

    if digest_result.strengths:
        parts.append("\n## Strengths")
        for s in digest_result.strengths:
            parts.append(f"- {s}")

    if digest_result.weaknesses:
        parts.append("\n## Weaknesses")
        for w in digest_result.weaknesses:
            parts.append(f"- {w}")

    if digest_result.opportunities:
        parts.append("\n## Opportunities")
        for o in digest_result.opportunities:
            parts.append(f"- {o}")

    if digest_result.threats:
        parts.append("\n## Threats")
        for t in digest_result.threats:
            parts.append(f"- {t}")

    if digest_result.cross_check_findings:
        parts.append("\n## Cross-Check Findings")
        for c in digest_result.cross_check_findings:
            parts.append(f"- {c}")

    if digest_result.confidence_notes:
        parts.append("\n## Confidence Notes")
        for n in digest_result.confidence_notes:
            parts.append(f"- {n}")

    return "\n".join(parts)


def _crosscheck_to_markdown(result) -> str:
    """Convert a CrossCheckResult to formatted markdown."""
    parts = [f"# 360° Data Crosscheck\n"]
    parts.append(f"**Overall Confidence Score:** {result.confidence_score:.0%}\n")

    if result.consolidated_summary:
        parts.append(f"## Consolidated Summary\n{result.consolidated_summary}\n")

    if result.validated_facts:
        parts.append("## Validated Facts (Multi-Source Confirmed)")
        for f in result.validated_facts:
            parts.append(f"- {f}")

    if result.contradictions:
        parts.append("\n## Contradictions Found")
        for c in result.contradictions:
            parts.append(f"- {c}")

    if result.data_gaps:
        parts.append("\n## Data Gaps")
        for g in result.data_gaps:
            parts.append(f"- {g}")

    if result.recommendations:
        parts.append("\n## Recommendations")
        for r in result.recommendations:
            parts.append(f"- {r}")

    return "\n".join(parts)


async def run_potential_clients_analysis(primary_company_id: str) -> None:
    """Aggregate competitor client data and research potential clients for Spain/Europe."""
    async with async_session() as session:
        service = CompanyService(session)
        primary = await service.get_by_id(primary_company_id)
        if not primary:
            logger.error("Primary company %s not found", primary_company_id)
            return

        # Get all non-primary companies (competitors)
        all_companies = await service.list_all(limit=100)
        competitor_ids = [c.id for c in all_companies if c.id != primary_company_id]

        if not competitor_ids:
            logger.warning("No competitors found for potential clients analysis")
            return

        # Aggregate competitor client data
        competitor_clients = await service.get_all_competitor_clients(competitor_ids)

        # Build context for the AI
        parts = [f"# Primary Company: {primary.name}"]
        if primary.description:
            parts.append(f"Description: {primary.description}")
        if primary.icp_analysis:
            parts.append(f"\n## Primary Company ICP\n{primary.icp_analysis}")

        parts.append("\n# Competitor Client Data")
        for comp in all_companies:
            if comp.id in competitor_clients:
                parts.append(f"\n## {comp.name} - Known Clients")
                for client in competitor_clients[comp.id]:
                    line = f"- {client.client_name}"
                    if client.industry:
                        line += f" ({client.industry})"
                    if client.region:
                        line += f" - {client.region}"
                    if client.company_size:
                        line += f" [{client.company_size}]"
                    parts.append(line)
                if comp.icp_analysis:
                    parts.append(f"ICP: {comp.icp_analysis}")

        context = "\n".join(parts)

        logger.info("Running potential clients research for %s ...", primary.name)
        from app.intelligence.pipelines.potential_clients import (
            run_potential_clients_research,
        )

        result = await run_potential_clients_research(primary.name, context)

        # Convert to markdown digest
        md_parts = [f"# Potential Clients for {primary.name}\n"]
        md_parts.append(f"## Analysis Summary\n{result.analysis_summary}\n")
        md_parts.append(f"## Methodology\n{result.methodology}\n")
        md_parts.append("## Potential Clients")
        for pc in result.potential_clients:
            md_parts.append(f"\n### {pc.company_name}")
            if pc.domain:
                md_parts.append(f"- Website: {pc.domain}")
            md_parts.append(f"- Country: {pc.country}")
            md_parts.append(f"- Industry: {pc.industry}")
            md_parts.append(f"- Why good fit: {pc.why_good_fit}")
            if pc.equivalent_competitor_client:
                md_parts.append(f"- Equivalent to: {pc.equivalent_competitor_client}")
            md_parts.append(f"- Confidence: {pc.confidence}")

        digest_md = "\n".join(md_parts)
        await service.store_digest(primary_company_id, digest_md, "potential_clients")
        logger.info("Potential clients analysis complete for %s", primary.name)
