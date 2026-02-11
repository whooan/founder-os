from __future__ import annotations

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import SOCIAL_DIGEST_SYSTEM_PROMPT
from app.intelligence.schemas import SocialDigestResult


async def run_social_digest(
    company_name: str, social_content: str
) -> SocialDigestResult:
    """Summarize social media activity across all platforms."""
    return await structured_completion(
        system_prompt=SOCIAL_DIGEST_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"SOCIAL MEDIA CONTENT:\n{social_content}"
        ),
        response_model=SocialDigestResult,
    )
