from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.api.deps import get_company_service
from app.schemas.company import CompanyCreate, CompanyDetail, CompanyRead
from app.schemas.intelligence import PipelineStatusResponse
from app.services.company_service import CompanyService

router = APIRouter()


@router.post("/", response_model=CompanyRead, status_code=201)
async def create_company(
    data: CompanyCreate,
    background_tasks: BackgroundTasks,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.create(data)
    # Import here to avoid circular imports at module level
    from app.intelligence.orchestrator import run_full_enrichment

    background_tasks.add_task(run_full_enrichment, company.id)
    return company


@router.get("/", response_model=list[CompanyRead])
async def list_companies(
    skip: int = 0,
    limit: int = 50,
    q: str | None = None,
    service: CompanyService = Depends(get_company_service),
):
    if q:
        return await service.search(q)
    return await service.list_all(skip=skip, limit=limit)


@router.get("/{company_id}", response_model=CompanyDetail)
async def get_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    company = await service.get_by_id(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    deleted = await service.delete(company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")


@router.get("/{company_id}/status", response_model=PipelineStatusResponse)
async def get_company_status(
    company_id: str,
    service: CompanyService = Depends(get_company_service),
):
    status = await service.get_status(company_id)
    if status == "not_found":
        raise HTTPException(status_code=404, detail="Company not found")
    return PipelineStatusResponse(status=status, company_id=company_id)
