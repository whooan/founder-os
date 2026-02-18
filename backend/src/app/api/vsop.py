from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_vsop_service
from app.schemas.vsop import (
    VsopGrantCreate,
    VsopGrantRead,
    VsopGrantUpdate,
    VsopPoolCreate,
    VsopPoolRead,
    VsopPoolUpdate,
    VsopSummary,
)
from app.services.vsop_service import VsopService

router = APIRouter()


# ── Pool ─────────────────────────────────────────────────────

@router.get("/{company_id}/pool", response_model=VsopPoolRead | None)
async def get_pool(
    company_id: str,
    service: VsopService = Depends(get_vsop_service),
):
    return await service.get_pool(company_id)


@router.put("/{company_id}/pool", response_model=VsopPoolRead)
async def upsert_pool(
    company_id: str,
    data: VsopPoolCreate,
    service: VsopService = Depends(get_vsop_service),
):
    return await service.upsert_pool(company_id, data)


@router.delete("/{company_id}/pool", status_code=204)
async def delete_pool(
    company_id: str,
    service: VsopService = Depends(get_vsop_service),
):
    ok = await service.delete_pool(company_id)
    if not ok:
        raise HTTPException(status_code=404, detail="VSOP pool not found")


# ── Grants ───────────────────────────────────────────────────

@router.post(
    "/{company_id}/grants",
    response_model=VsopGrantRead,
    status_code=201,
)
async def create_grant(
    company_id: str,
    data: VsopGrantCreate,
    service: VsopService = Depends(get_vsop_service),
):
    try:
        return await service.create_grant(company_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/grants/{grant_id}", response_model=VsopGrantRead)
async def update_grant(
    grant_id: str,
    data: VsopGrantUpdate,
    service: VsopService = Depends(get_vsop_service),
):
    grant = await service.update_grant(grant_id, data)
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    return grant


@router.delete("/grants/{grant_id}", status_code=204)
async def delete_grant(
    grant_id: str,
    service: VsopService = Depends(get_vsop_service),
):
    ok = await service.delete_grant(grant_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Grant not found")


# ── Summary ──────────────────────────────────────────────────

@router.get("/{company_id}/summary", response_model=VsopSummary)
async def get_summary(
    company_id: str,
    service: VsopService = Depends(get_vsop_service),
):
    return await service.get_summary(company_id)
