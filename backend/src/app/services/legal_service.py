from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company_legal import CompanyLegal
from app.models.legal_document import LegalDocument
from app.schemas.legal import (
    CompanyLegalCreate,
    CompanyLegalUpdate,
    LegalDocumentCreate,
    LegalDocumentUpdate,
)


class LegalService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Legal Documents ──────────────────────────────────────

    async def create_document(
        self, company_id: str, data: LegalDocumentCreate
    ) -> LegalDocument:
        doc_data = data.model_dump()
        date_str = doc_data.pop("date", None)
        if date_str:
            try:
                doc_data["date"] = datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                doc_data["date"] = None
        doc = LegalDocument(company_id=company_id, **doc_data)
        self.session.add(doc)
        await self.session.commit()
        await self.session.refresh(doc)
        return doc

    async def update_document(
        self, doc_id: str, data: LegalDocumentUpdate
    ) -> LegalDocument | None:
        stmt = select(LegalDocument).where(LegalDocument.id == doc_id)
        result = await self.session.execute(stmt)
        doc = result.scalar_one_or_none()
        if not doc:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "date" and isinstance(value, str):
                try:
                    value = datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    value = None
            setattr(doc, field, value)
        await self.session.commit()
        await self.session.refresh(doc)
        return doc

    async def delete_document(self, doc_id: str) -> bool:
        stmt = select(LegalDocument).where(LegalDocument.id == doc_id)
        result = await self.session.execute(stmt)
        doc = result.scalar_one_or_none()
        if not doc:
            return False
        await self.session.delete(doc)
        await self.session.commit()
        return True

    async def list_documents(self, company_id: str) -> list[LegalDocument]:
        stmt = (
            select(LegalDocument)
            .where(LegalDocument.company_id == company_id)
            .order_by(LegalDocument.date.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ── Company Legal Info ───────────────────────────────────

    async def get_company_legal(self, company_id: str) -> CompanyLegal | None:
        stmt = select(CompanyLegal).where(
            CompanyLegal.company_id == company_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_company_legal(
        self, company_id: str, data: CompanyLegalCreate | CompanyLegalUpdate
    ) -> CompanyLegal:
        stmt = select(CompanyLegal).where(
            CompanyLegal.company_id == company_id
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        update_data = data.model_dump(exclude_unset=True)

        # Parse registration_date if present
        if "registration_date" in update_data and isinstance(
            update_data["registration_date"], str
        ):
            try:
                update_data["registration_date"] = datetime.fromisoformat(
                    update_data["registration_date"]
                )
            except (ValueError, TypeError):
                update_data["registration_date"] = None

        if existing:
            for field, value in update_data.items():
                setattr(existing, field, value)
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        cl = CompanyLegal(company_id=company_id, **update_data)
        self.session.add(cl)
        await self.session.commit()
        await self.session.refresh(cl)
        return cl
