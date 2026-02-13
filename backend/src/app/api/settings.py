from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.settings_service import SettingsService

router = APIRouter()


class SettingsResponse(BaseModel):
    openai_api_key_masked: str
    openai_model: str
    is_configured: bool


class SettingsUpdate(BaseModel):
    openai_api_key: str | None = None
    openai_model: str | None = None


class SettingsStatus(BaseModel):
    is_configured: bool


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(session: AsyncSession = Depends(get_session)):
    svc = SettingsService(session)
    masked_key = await svc.get_masked("openai_api_key")
    model = await svc.get_openai_model() or "gpt-4o"
    is_configured = bool(masked_key)
    return SettingsResponse(
        openai_api_key_masked=masked_key,
        openai_model=model,
        is_configured=is_configured,
    )


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate, session: AsyncSession = Depends(get_session)
):
    svc = SettingsService(session)
    if body.openai_api_key is not None:
        await svc.set("openai_api_key", body.openai_api_key, is_secret=True)
    if body.openai_model is not None:
        await svc.set("openai_model", body.openai_model, is_secret=False)

    masked_key = await svc.get_masked("openai_api_key")
    model = await svc.get_openai_model() or "gpt-4o"
    return SettingsResponse(
        openai_api_key_masked=masked_key,
        openai_model=model,
        is_configured=bool(masked_key),
    )


@router.get("/settings/status", response_model=SettingsStatus)
async def get_settings_status(session: AsyncSession = Depends(get_session)):
    svc = SettingsService(session)
    key = await svc.get_openai_api_key()
    return SettingsStatus(is_configured=bool(key))
