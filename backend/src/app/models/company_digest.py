from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class CompanyDigest(Base):
    __tablename__ = "company_digests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    digest_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    digest_type: Mapped[str] = mapped_column(
        String(50), default="full"
    )  # full, social, comparison
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship(back_populates="digests")
