from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class CompanyLegal(Base):
    __tablename__ = "company_legals"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    legal_name: Mapped[Optional[str]] = mapped_column(String(300))
    cif: Mapped[Optional[str]] = mapped_column(String(50))
    registered_address: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    postal_code: Mapped[Optional[str]] = mapped_column(String(20))
    country: Mapped[Optional[str]] = mapped_column(String(100))
    registration_number: Mapped[Optional[str]] = mapped_column(String(100))
    registration_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notary: Mapped[Optional[str]] = mapped_column(String(200))
    protocol_number: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id"), unique=True
    )
    company: Mapped["Company"] = relationship()

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
