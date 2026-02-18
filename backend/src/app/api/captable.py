from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_captable_service
from app.schemas.captable import (
    CapTableEvolutionEntry,
    CapTableKPIs,
    CapTableSnapshot,
    EquityEventCreate,
    EquityEventRead,
    ShareClassCreate,
    ShareClassRead,
    StakeholderCreate,
    StakeholderRead,
    StakeholderUpdate,
)
from app.services.captable_service import CapTableService, serialize_event

router = APIRouter()


# ── Share Classes ────────────────────────────────────────────

@router.get("/{company_id}/share-classes", response_model=list[ShareClassRead])
async def list_share_classes(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.list_share_classes(company_id)


@router.post(
    "/{company_id}/share-classes",
    response_model=ShareClassRead,
    status_code=201,
)
async def create_share_class(
    company_id: str,
    data: ShareClassCreate,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.create_share_class(company_id, data)


@router.delete("/share-classes/{share_class_id}", status_code=204)
async def delete_share_class(
    share_class_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    ok = await service.delete_share_class(share_class_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Share class not found")


# ── Stakeholders ─────────────────────────────────────────────

@router.get("/{company_id}/stakeholders", response_model=list[StakeholderRead])
async def list_stakeholders(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.list_stakeholders(company_id)


@router.post(
    "/{company_id}/stakeholders",
    response_model=StakeholderRead,
    status_code=201,
)
async def create_stakeholder(
    company_id: str,
    data: StakeholderCreate,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.create_stakeholder(company_id, data)


@router.put("/stakeholders/{stakeholder_id}", response_model=StakeholderRead)
async def update_stakeholder(
    stakeholder_id: str,
    data: StakeholderUpdate,
    service: CapTableService = Depends(get_captable_service),
):
    sh = await service.update_stakeholder(stakeholder_id, data)
    if not sh:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    return sh


@router.delete("/stakeholders/{stakeholder_id}", status_code=204)
async def delete_stakeholder(
    stakeholder_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    ok = await service.delete_stakeholder(stakeholder_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Stakeholder not found")


# ── Equity Events ────────────────────────────────────────────

@router.get("/{company_id}/events", response_model=list[EquityEventRead])
async def list_equity_events(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    events = await service.list_equity_events(company_id)
    return [serialize_event(e) for e in events]


@router.post(
    "/{company_id}/events",
    response_model=EquityEventRead,
    status_code=201,
)
async def create_equity_event(
    company_id: str,
    data: EquityEventCreate,
    service: CapTableService = Depends(get_captable_service),
):
    event = await service.create_equity_event(company_id, data)
    return serialize_event(event)


@router.delete("/events/{event_id}", status_code=204)
async def delete_equity_event(
    event_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    ok = await service.delete_equity_event(event_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Equity event not found")


# ── Cap Table Views ──────────────────────────────────────────

@router.get("/{company_id}/kpis", response_model=CapTableKPIs)
async def get_cap_table_kpis(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.get_kpis(company_id)


@router.get("/{company_id}/snapshot", response_model=CapTableSnapshot)
async def get_cap_table_snapshot(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.get_cap_table(company_id)


@router.get(
    "/{company_id}/evolution",
    response_model=list[CapTableEvolutionEntry],
)
async def get_cap_table_evolution(
    company_id: str,
    service: CapTableService = Depends(get_captable_service),
):
    return await service.get_cap_table_evolution(company_id)
