"""Client intelligence pipeline: extract clients, ICP, geography, industry."""

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import CLIENT_INTELLIGENCE_SYSTEM_PROMPT
from app.intelligence.research import ResearchContext
from app.intelligence.schemas import ClientIntelligenceResult


async def run_client_intelligence(
    company_name: str, research_context: ResearchContext
) -> ClientIntelligenceResult:
    """Extract client intelligence from research context."""
    return await structured_completion(
        system_prompt=CLIENT_INTELLIGENCE_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"SOURCE MATERIAL:\n{research_context.combined_text}\n\n"
            f"SOURCE INDEX:\n{research_context.source_summary}"
        ),
        response_model=ClientIntelligenceResult,
    )
