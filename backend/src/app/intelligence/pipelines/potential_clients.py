"""Potential clients research pipeline: find prospects in Spain/Europe."""

from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import POTENTIAL_CLIENTS_SYSTEM_PROMPT
from app.intelligence.schemas import PotentialClientsResult


async def run_potential_clients_research(
    primary_company_name: str,
    competitor_context: str,
) -> PotentialClientsResult:
    """Research potential clients based on competitor client data and ICP analysis."""
    return await structured_completion(
        system_prompt=POTENTIAL_CLIENTS_SYSTEM_PROMPT,
        user_prompt=competitor_context,
        response_model=PotentialClientsResult,
    )
