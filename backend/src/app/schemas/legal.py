from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Legal Documents ──────────────────────────────────────────

class LegalDocumentCreate(BaseModel):
    title: str
    doc_type: str  # escritura | pact | sha | bylaws | board_resolution | other
    date: str | None = None  # ISO date string
    summary: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    notes: str | None = None


class LegalDocumentUpdate(BaseModel):
    title: str | None = None
    doc_type: str | None = None
    date: str | None = None
    summary: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    notes: str | None = None


class LegalDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    doc_type: str
    date: datetime | None
    summary: str | None
    file_url: str | None
    file_name: str | None
    notes: str | None
    created_at: datetime | None = None


# ── Company Legal Info ───────────────────────────────────────

class CompanyLegalCreate(BaseModel):
    legal_name: str | None = None
    cif: str | None = None
    registered_address: str | None = None
    city: str | None = None
    postal_code: str | None = None
    country: str | None = None
    registration_number: str | None = None
    registration_date: str | None = None  # ISO date string
    notary: str | None = None
    protocol_number: str | None = None
    notes: str | None = None


class CompanyLegalUpdate(BaseModel):
    legal_name: str | None = None
    cif: str | None = None
    registered_address: str | None = None
    city: str | None = None
    postal_code: str | None = None
    country: str | None = None
    registration_number: str | None = None
    registration_date: str | None = None
    notary: str | None = None
    protocol_number: str | None = None
    notes: str | None = None


class CompanyLegalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    legal_name: str | None
    cif: str | None
    registered_address: str | None
    city: str | None
    postal_code: str | None
    country: str | None
    registration_number: str | None
    registration_date: datetime | None
    notary: str | None
    protocol_number: str | None
    notes: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None
