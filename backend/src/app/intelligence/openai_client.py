from typing import TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)


async def _get_api_key() -> str:
    """Resolve API key: DB first, then env var fallback."""
    try:
        from app.database import async_session_factory
        from app.services.settings_service import SettingsService

        async with async_session_factory() as session:
            svc = SettingsService(session)
            db_key = await svc.get_openai_api_key()
            if db_key:
                return db_key
    except Exception:
        pass
    return settings.openai_api_key


async def _get_model() -> str:
    """Resolve model: DB first, then env var fallback."""
    try:
        from app.database import async_session_factory
        from app.services.settings_service import SettingsService

        async with async_session_factory() as session:
            svc = SettingsService(session)
            db_model = await svc.get_openai_model()
            if db_model:
                return db_model
    except Exception:
        pass
    return settings.openai_model


def _get_client(api_key: str) -> AsyncOpenAI:
    """Create a fresh client with the given API key."""
    return AsyncOpenAI(api_key=api_key)


async def structured_completion(
    system_prompt: str,
    user_prompt: str,
    response_model: type[T],
    model: str | None = None,
) -> T:
    """Call OpenAI with structured output, returning a validated Pydantic model."""
    api_key = await _get_api_key()
    client = _get_client(api_key)
    resolved_model = model or await _get_model()

    completion = await client.beta.chat.completions.parse(
        model=resolved_model,
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
    api_key = await _get_api_key()
    client = _get_client(api_key)
    resolved_model = model or await _get_model()

    response = await client.chat.completions.create(
        model=resolved_model,
        messages=messages,
    )
    content = response.choices[0].message.content
    return content or ""
