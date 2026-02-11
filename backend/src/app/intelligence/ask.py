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
            # Search for relevant companies based on the question
            companies = await service.search(query.question[:100])
            for c in companies[:5]:
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
