from __future__ import annotations

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import CROSSCHECK_SYSTEM_PROMPT
from app.intelligence.schemas import CrossCheckResult


async def run_crosscheck(
    company_name: str, all_data_context: str
) -> CrossCheckResult:
    """Perform 360-degree crosscheck validation of all collected company data."""
    return await structured_completion(
        system_prompt=CROSSCHECK_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"ALL COLLECTED DATA FOR CROSSCHECK:\n{all_data_context}"
        ),
        response_model=CrossCheckResult,
        model="gpt-5.2",
    )
