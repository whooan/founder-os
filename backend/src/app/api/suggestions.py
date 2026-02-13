"""CEO Suggestions router: potential customers, product direction, briefing."""
from __future__ import annotations

import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.api.deps import get_company_service
from app.services.company_service import CompanyService

router = APIRouter()


@router.get("/{company_id}")
async def get_suggestions(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    """Get cached suggestions or return empty."""
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if not company.is_primary:
        raise HTTPException(
            status_code=400,
            detail="Suggestions only available for primary company",
        )

    # Check for cached suggestions digest
    digest = next(
        (d for d in (company.digests or []) if d.digest_type == "suggestions"),
        None,
    )
    if digest:
        try:
            return json.loads(digest.digest_markdown)
        except (json.JSONDecodeError, TypeError):
            return {"status": "no_suggestions"}
    return {"status": "no_suggestions"}


@router.post("/{company_id}/generate", status_code=202)
async def generate_suggestions(
    company_id: str,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    """Trigger background generation of CEO suggestions."""
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if not company.is_primary:
        raise HTTPException(
            status_code=400,
            detail="Suggestions only available for primary company",
        )
    from app.intelligence.orchestrator import run_suggestions_generation

    background_tasks.add_task(run_suggestions_generation, company_id)
    return {"status": "accepted", "message": "Suggestions generation started"}
