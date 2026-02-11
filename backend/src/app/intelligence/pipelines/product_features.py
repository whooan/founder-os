from __future__ import annotations

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import PRODUCT_FEATURES_SYSTEM_PROMPT
from app.intelligence.research import ResearchContext
from app.intelligence.schemas import ProductFeaturesResult


async def run_product_features(
    company_name: str, research_context: ResearchContext
) -> ProductFeaturesResult:
    """Extract product features from research context."""
    return await structured_completion(
        system_prompt=PRODUCT_FEATURES_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"SOURCE MATERIAL:\n{research_context.combined_text}\n\n"
            f"SOURCE INDEX:\n{research_context.source_summary}"
        ),
        response_model=ProductFeaturesResult,
    )
