from app.intelligence.openai_client import structured_completion
from app.intelligence.prompts import EVENT_EXTRACTION_SYSTEM_PROMPT
from app.intelligence.research import ResearchContext
from app.intelligence.schemas import EventExtractionResult


async def run_event_extraction(
    company_name: str, research_context: ResearchContext
) -> EventExtractionResult:
    return await structured_completion(
        system_prompt=EVENT_EXTRACTION_SYSTEM_PROMPT,
        user_prompt=(
            f"Company: {company_name}\n\n"
            f"SOURCE MATERIAL:\n{research_context.combined_text}\n\n"
            f"SOURCE INDEX:\n{research_context.source_summary}"
        ),
        response_model=EventExtractionResult,
    )
