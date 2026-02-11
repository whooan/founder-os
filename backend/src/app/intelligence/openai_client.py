from typing import TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def structured_completion(
    system_prompt: str,
    user_prompt: str,
    response_model: type[T],
    model: str | None = None,
) -> T:
    """Call OpenAI with structured output, returning a validated Pydantic model."""
    completion = await client.beta.chat.completions.parse(
        model=model or settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format=response_model,
    )
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI returned no parsed response")
    return parsed


async def chat_completion(
    messages: list[dict],
    model: str | None = None,
) -> str:
    """Standard chat completion for Ask Mode."""
    response = await client.chat.completions.create(
        model=model or settings.openai_model,
        messages=messages,
    )
    content = response.choices[0].message.content
    return content or ""
