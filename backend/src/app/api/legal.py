from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_legal_service
from app.schemas.legal import (
    CompanyLegalCreate,
    CompanyLegalRead,
    CompanyLegalUpdate,
    LegalDocumentCreate,
    LegalDocumentRead,
    LegalDocumentUpdate,
)
from app.services.legal_service import LegalService

router = APIRouter()


# ── Legal Documents ──────────────────────────────────────────

@router.get("/{company_id}/documents", response_model=list[LegalDocumentRead])
async def list_documents(
    company_id: str,
    service: LegalService = Depends(get_legal_service),
):
    return await service.list_documents(company_id)


@router.post(
    "/{company_id}/documents",
    response_model=LegalDocumentRead,
    status_code=201,
)
async def create_document(
    company_id: str,
    data: LegalDocumentCreate,
    service: LegalService = Depends(get_legal_service),
):
    return await service.create_document(company_id, data)


@router.put("/documents/{doc_id}", response_model=LegalDocumentRead)
async def update_document(
    doc_id: str,
    data: LegalDocumentUpdate,
    service: LegalService = Depends(get_legal_service),
):
    doc = await service.update_document(doc_id, data)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    service: LegalService = Depends(get_legal_service),
):
    ok = await service.delete_document(doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")


# ── Company Legal Info ───────────────────────────────────────

@router.get("/{company_id}/company-info", response_model=CompanyLegalRead | None)
async def get_company_legal(
    company_id: str,
    service: LegalService = Depends(get_legal_service),
):
    return await service.get_company_legal(company_id)


@router.put("/{company_id}/company-info", response_model=CompanyLegalRead)
async def upsert_company_legal(
    company_id: str,
    data: CompanyLegalUpdate,
    service: LegalService = Depends(get_legal_service),
):
    return await service.upsert_company_legal(company_id, data)
