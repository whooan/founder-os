from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.settings_service import SettingsService

router = APIRouter()


class SettingsResponse(BaseModel):
    founder_name: str
    org_name: str
    openai_api_key_masked: str
    openai_model: str
    is_configured: bool
    auto_update_enabled: bool
    auto_update_hour: int
    last_daily_update: str | None
    holded_api_key_masked: str
    holded_configured: bool


class SettingsUpdate(BaseModel):
    founder_name: str | None = None
    org_name: str | None = None
    openai_api_key: str | None = None
    openai_model: str | None = None
    auto_update_enabled: bool | None = None
    auto_update_hour: int | None = None
    holded_api_key: str | None = None


class SettingsStatus(BaseModel):
    is_configured: bool


class ProfileResponse(BaseModel):
    founder_name: str
    org_name: str


async def _build_response(svc: SettingsService) -> SettingsResponse:
    masked_key = await svc.get_masked("openai_api_key")
    model = await svc.get_openai_model() or "gpt-5.2"
    founder_name = await svc.get("founder_name") or ""
    org_name = await svc.get("org_name") or ""
    auto_enabled = (await svc.get("auto_update_enabled")) == "true"
    hour_str = await svc.get("auto_update_hour")
    auto_hour = int(hour_str) if hour_str else 7
    last_update = await svc.get("last_daily_update")
    holded_masked = await svc.get_masked("holded_api_key")
    return SettingsResponse(
        founder_name=founder_name,
        org_name=org_name,
        openai_api_key_masked=masked_key,
        openai_model=model,
        is_configured=bool(masked_key),
        auto_update_enabled=auto_enabled,
        auto_update_hour=auto_hour,
        last_daily_update=last_update,
        holded_api_key_masked=holded_masked,
        holded_configured=bool(holded_masked),
    )


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(session: AsyncSession = Depends(get_session)):
    svc = SettingsService(session)
    return await _build_response(svc)


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate, session: AsyncSession = Depends(get_session)
):
    svc = SettingsService(session)
    if body.founder_name is not None:
        await svc.set("founder_name", body.founder_name)
    if body.org_name is not None:
        await svc.set("org_name", body.org_name)
    if body.openai_api_key is not None:
        await svc.set("openai_api_key", body.openai_api_key, is_secret=True)
    if body.openai_model is not None:
        await svc.set("openai_model", body.openai_model, is_secret=False)
    if body.auto_update_enabled is not None:
        await svc.set(
            "auto_update_enabled",
            "true" if body.auto_update_enabled else "false",
        )
    if body.auto_update_hour is not None:
        await svc.set("auto_update_hour", str(body.auto_update_hour))
    if body.holded_api_key is not None:
        await svc.set("holded_api_key", body.holded_api_key, is_secret=True)

    # Sync scheduler if auto-update settings changed
    if body.auto_update_enabled is not None or body.auto_update_hour is not None:
        from app.scheduler import sync_scheduler
        await sync_scheduler()

    return await _build_response(svc)


@router.get("/settings/status", response_model=SettingsStatus)
async def get_settings_status(session: AsyncSession = Depends(get_session)):
    svc = SettingsService(session)
    key = await svc.get_openai_api_key()
    return SettingsStatus(is_configured=bool(key))


@router.get("/settings/profile", response_model=ProfileResponse)
async def get_profile(session: AsyncSession = Depends(get_session)):
    svc = SettingsService(session)
    founder_name = await svc.get("founder_name") or ""
    org_name = await svc.get("org_name") or ""
    return ProfileResponse(founder_name=founder_name, org_name=org_name)


@router.post("/settings/update-now", status_code=202)
async def trigger_update_now(background_tasks: BackgroundTasks):
    """Manually trigger an incremental update for all companies right now."""
    from app.scheduler import _daily_update_job
    background_tasks.add_task(_daily_update_job)
    return {"message": "Update triggered"}
