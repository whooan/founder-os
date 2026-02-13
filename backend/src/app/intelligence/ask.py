import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.intelligence.openai_client import chat_completion
from app.intelligence.prompts import ASK_SYSTEM_PROMPT
from app.models.company import Company
from app.schemas.intelligence import AskQuery, AskResponse
from app.services.company_service import CompanyService

logger = logging.getLogger(__name__)


def _format_company_context(company: Company) -> str:
    """Format a company's data as context for the AI."""
    parts = [f"## {company.name}"]

    if company.is_primary:
        parts.append("**Role:** Primary (Your Company)")
    if company.domain:
        parts.append(f"**Domain:** {company.domain}")
    if company.founded_year:
        parts.append(f"**Founded:** {company.founded_year}")
    if company.employee_range:
        parts.append(f"**Employees:** {company.employee_range}")

    if company.one_liner:
        parts.append(f"**One-liner:** {company.one_liner}")
    if company.description:
        parts.append(f"**Description:** {company.description}")
    if company.stage:
        parts.append(f"**Stage:** {company.stage}")
    if company.hq_location:
        parts.append(f"**HQ:** {company.hq_location}")
    if company.positioning_summary:
        parts.append(f"**Positioning:** {company.positioning_summary}")
    if company.gtm_strategy:
        parts.append(f"**GTM Strategy:** {company.gtm_strategy}")

    if company.founders:
        founder_lines = []
        for f in company.founders:
            line = f"- {f.name}"
            if f.title:
                line += f" ({f.title})"
            founder_lines.append(line)
        parts.append("**Founders:**\n" + "\n".join(founder_lines))

    if company.funding_rounds:
        round_lines = []
        for fr in company.funding_rounds:
            line = f"- {fr.round_name}"
            if fr.amount_usd:
                line += f": ${fr.amount_usd:,}"
            inv_names = [inv.name for inv in fr.investors]
            if inv_names:
                line += f" (investors: {', '.join(inv_names)})"
            round_lines.append(line)
        parts.append("**Funding:**\n" + "\n".join(round_lines))

    if company.events:
        event_lines = []
        from datetime import datetime as _dt
        for e in sorted(
            company.events,
            key=lambda x: x.event_date if isinstance(x.event_date, _dt) else _dt.min,
            reverse=True,
        )[:10]:
            date_str = (
                e.event_date.strftime("%Y-%m-%d") if e.event_date else "Unknown date"
            )
            source_note = f" [source: {e.source_url}]" if e.source_url else ""
            event_lines.append(
                f"- [{e.event_type}] {date_str}: {e.title}{source_note}"
            )
        parts.append("**Recent Events:**\n" + "\n".join(event_lines))

    if company.top_topics:
        try:
            topics = json.loads(company.top_topics)
            parts.append(f"**Top Topics:** {', '.join(topics)}")
        except (json.JSONDecodeError, TypeError):
            pass

    if company.key_differentiators:
        try:
            diffs = json.loads(company.key_differentiators)
            parts.append(f"**Key Differentiators:** {', '.join(diffs)}")
        except (json.JSONDecodeError, TypeError):
            pass

    if company.risk_signals:
        try:
            risks = json.loads(company.risk_signals)
            parts.append(f"**Risk Signals:** {', '.join(risks)}")
        except (json.JSONDecodeError, TypeError):
            pass

    # Include research sources so the AI can cite them
    if company.data_sources:
        source_lines = []
        for ds in company.data_sources[:20]:
            label = ds.title or "Source"
            source_lines.append(f"- [{label}]({ds.url})")
        parts.append("**Research Sources:**\n" + "\n".join(source_lines))

    # Products with features
    if company.products:
        product_lines = []
        for p in company.products:
            line = f"- {p.name}"
            if p.description:
                line += f": {p.description}"
            if p.features:
                try:
                    feats = json.loads(p.features)
                    if feats:
                        line += f"\n  Features: {', '.join(feats)}"
                except (json.JSONDecodeError, TypeError):
                    pass
            product_lines.append(line)
        parts.append("**Products:**\n" + "\n".join(product_lines))

    # Market categories
    if company.categories:
        cat_names = [c.name for c in company.categories]
        parts.append(f"**Market Categories:** {', '.join(cat_names)}")

    # Media tone
    if company.media_tone:
        try:
            tone = json.loads(company.media_tone)
            tone_parts = [f"{k}: {v}" for k, v in tone.items()]
            parts.append("**Media Tone:** " + "; ".join(tone_parts))
        except (json.JSONDecodeError, TypeError):
            pass

    # Posting frequency
    if company.posting_frequency:
        parts.append(f"**Posting Frequency:** {company.posting_frequency}")

    # Social posts
    if company.social_posts:
        post_lines = []
        for sp in company.social_posts[:20]:
            snippet = (sp.content[:200] + "...") if sp.content and len(sp.content) > 200 else (sp.content or "")
            line = f"- [{sp.platform}] {snippet}"
            if sp.url:
                line += f" ({sp.url})"
            post_lines.append(line)
        parts.append("**Social Posts:**\n" + "\n".join(post_lines))

    # Competitor clients
    if company.competitor_clients:
        client_lines = []
        for cc in company.competitor_clients:
            line = f"- {cc.client_name}"
            details = []
            if cc.industry:
                details.append(f"industry: {cc.industry}")
            if cc.region:
                details.append(f"region: {cc.region}")
            if cc.company_size:
                details.append(f"size: {cc.company_size}")
            if cc.relationship_type:
                details.append(f"type: {cc.relationship_type}")
            if cc.confidence:
                details.append(f"confidence: {cc.confidence}")
            if details:
                line += f" ({', '.join(details)})"
            client_lines.append(line)
        parts.append("**Known Clients:**\n" + "\n".join(client_lines))

    # ICP analysis
    if company.icp_analysis:
        try:
            icp = json.loads(company.icp_analysis)
            icp_lines = []
            if icp.get("buyer_persona"):
                icp_lines.append(f"Buyer Persona: {icp['buyer_persona']}")
            if icp.get("target_segments"):
                icp_lines.append(f"Target Segments: {', '.join(icp['target_segments'])}")
            if icp.get("ideal_company_size"):
                icp_lines.append(f"Ideal Company Size: {icp['ideal_company_size']}")
            if icp.get("ideal_industries"):
                icp_lines.append(f"Ideal Industries: {', '.join(icp['ideal_industries'])}")
            if icp.get("pain_points"):
                icp_lines.append(f"Pain Points: {', '.join(icp['pain_points'])}")
            if icp.get("buying_criteria"):
                icp_lines.append(f"Buying Criteria: {', '.join(icp['buying_criteria'])}")
            if icp_lines:
                parts.append("**ICP Analysis:**\n" + "\n".join(f"- {l}" for l in icp_lines))
        except (json.JSONDecodeError, TypeError):
            pass

    # Geography analysis
    if company.geography_analysis:
        try:
            geo = json.loads(company.geography_analysis)
            geo_lines = []
            if geo.get("hq_region"):
                geo_lines.append(f"HQ Region: {geo['hq_region']}")
            if geo.get("primary_markets"):
                geo_lines.append(f"Primary Markets: {', '.join(geo['primary_markets'])}")
            if geo.get("expansion_markets"):
                geo_lines.append(f"Expansion Markets: {', '.join(geo['expansion_markets'])}")
            if geo.get("market_presence_notes"):
                geo_lines.append(f"Notes: {geo['market_presence_notes']}")
            if geo_lines:
                parts.append("**Geography:**\n" + "\n".join(f"- {l}" for l in geo_lines))
        except (json.JSONDecodeError, TypeError):
            pass

    # Industry focus
    if company.industry_focus:
        try:
            ind = json.loads(company.industry_focus)
            ind_lines = []
            if ind.get("primary_industries"):
                ind_lines.append(f"Primary: {', '.join(ind['primary_industries'])}")
            if ind.get("secondary_industries"):
                ind_lines.append(f"Secondary: {', '.join(ind['secondary_industries'])}")
            if ind.get("vertical_strength"):
                ind_lines.append(f"Vertical Strength: {ind['vertical_strength']}")
            if ind.get("industry_notes"):
                ind_lines.append(f"Notes: {ind['industry_notes']}")
            if ind_lines:
                parts.append("**Industry Focus:**\n" + "\n".join(f"- {l}" for l in ind_lines))
        except (json.JSONDecodeError, TypeError):
            pass

    # Digests (full markdown — the richest synthesized intelligence)
    if company.digests:
        for d in company.digests:
            type_label = d.digest_type.replace("_", " ").title()
            parts.append(f"**Digest ({type_label}):**\n{d.digest_markdown}")

    return "\n\n".join(parts)


async def ask_intelligence(
    query: AskQuery,
    session: AsyncSession,
) -> AskResponse:
    try:
        service = CompanyService(session)

        context_parts: list[str] = []
        all_sources: list[dict] = []

        if query.company_id:
            logger.info(f"Ask: looking up company {query.company_id}")
            company = await service.get_by_id(query.company_id)
            if company:
                logger.info(
                    f"Ask: found {company.name}, "
                    f"data_sources={len(company.data_sources)}, "
                    f"events={len(company.events)}, "
                    f"founders={len(company.founders)}"
                )
                context_parts.append(_format_company_context(company))
                for ds in company.data_sources:
                    all_sources.append({"label": ds.title or ds.url, "url": ds.url})
            else:
                logger.warning(f"Ask: company {query.company_id} not found")
        else:
            # Load ALL tracked companies with full relations
            all_companies = await service.list_all(limit=100)
            for c in all_companies:
                full = await service.get_by_id(c.id)
                if full:
                    context_parts.append(_format_company_context(full))
                    for ds in full.data_sources:
                        all_sources.append(
                            {"label": ds.title or ds.url, "url": ds.url}
                        )

        context = (
            "\n\n---\n\n".join(context_parts)
            if context_parts
            else "No company data available."
        )

        logger.info(f"Ask: context length={len(context)}, sources={len(all_sources)}")

        messages = [
            {"role": "system", "content": ASK_SYSTEM_PROMPT},
            {"role": "system", "content": f"CONTEXT DATA:\n\n{context}"},
            {"role": "user", "content": query.question},
        ]

        answer = await chat_completion(messages)
        logger.info(f"Ask: answer length={len(answer)}")

        # Deduplicate sources
        seen_urls: set[str] = set()
        unique_sources: list[dict] = []
        for s in all_sources:
            if s["url"] not in seen_urls:
                seen_urls.add(s["url"])
                unique_sources.append(s)

        return AskResponse(answer=answer, sources=unique_sources[:20])

    except Exception as e:
        logger.exception(f"Ask endpoint error: {e}")
        raise


async def ask_intelligence_with_history(
    question: str,
    company_id: str | None,
    history: list[dict],
    session: AsyncSession,
) -> AskResponse:
    """Ask with conversation history for multi-turn context."""
    try:
        service = CompanyService(session)
        context_parts: list[str] = []
        all_sources: list[dict] = []

        if company_id:
            company = await service.get_by_id(company_id)
            if company:
                context_parts.append(_format_company_context(company))
                for ds in company.data_sources:
                    all_sources.append({"label": ds.title or ds.url, "url": ds.url})
        else:
            all_companies = await service.list_all(limit=100)
            for c in all_companies:
                full = await service.get_by_id(c.id)
                if full:
                    context_parts.append(_format_company_context(full))
                    for ds in full.data_sources:
                        all_sources.append({"label": ds.title or ds.url, "url": ds.url})

        context = (
            "\n\n---\n\n".join(context_parts)
            if context_parts
            else "No company data available."
        )

        # Build messages array with conversation history
        messages: list[dict] = [
            {"role": "system", "content": ASK_SYSTEM_PROMPT},
            {"role": "system", "content": f"CONTEXT DATA:\n\n{context}"},
        ]
        # Add conversation history (exclude the last user message — we add it fresh)
        for msg in history[:-1]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": question})

        answer = await chat_completion(messages)

        # Deduplicate sources
        seen_urls: set[str] = set()
        unique_sources: list[dict] = []
        for s in all_sources:
            if s["url"] not in seen_urls:
                seen_urls.add(s["url"])
                unique_sources.append(s)

        return AskResponse(answer=answer, sources=unique_sources[:20])

    except Exception as e:
        logger.exception(f"Ask with history error: {e}")
        raise


async def compare_chat(query, session):
    """Chat with full context of compared companies using GPT-4.1."""
    from app.schemas.intelligence import CompareResponse

    service = CompanyService(session)
    companies = await service.get_comparison_data(query.company_ids)

    if not companies:
        return CompareResponse(answer="No companies found for comparison.", sources=[])

    # Build comprehensive context
    context_parts = []
    all_sources = []
    for company in companies:
        ctx = _format_company_context(company)
        primary_label = " [PRIMARY - YOUR COMPANY]" if company.is_primary else ""
        context_parts.append(f"## {company.name}{primary_label}\n\n{ctx}")
        if hasattr(company, 'data_sources') and company.data_sources:
            for ds in company.data_sources[:10]:
                all_sources.append({"label": ds.title or ds.url, "url": ds.url})

    context = "\n\n---\n\n".join(context_parts)

    from app.intelligence.prompts import COMPARISON_SYSTEM_PROMPT
    messages = [
        {"role": "system", "content": COMPARISON_SYSTEM_PROMPT},
        {"role": "system", "content": f"COMPARISON DATA:\n\n{context}"},
        {"role": "user", "content": query.question},
    ]

    answer = await chat_completion(messages, model="gpt-5.2")

    # Deduplicate sources
    seen = set()
    unique_sources = []
    for s in all_sources:
        if s["url"] not in seen:
            seen.add(s["url"])
            unique_sources.append(s)

    return CompareResponse(answer=answer, sources=unique_sources[:20])
