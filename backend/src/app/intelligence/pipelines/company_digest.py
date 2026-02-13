from __future__ import annotations

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import COMPANY_DIGEST_SYSTEM_PROMPT
from app.intelligence.schemas import CompanyDigestResult


async def run_company_digest(
    company_name: str, all_data_context: str
) -> CompanyDigestResult:
    """Generate comprehensive cross-referenced company digest using large context model."""
    return await structured_completion(
        system_prompt=COMPANY_DIGEST_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"ALL AVAILABLE DATA:\n{all_data_context}"
        ),
        response_model=CompanyDigestResult,
        model="gpt-5.2",
    )
