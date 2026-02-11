from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class CompetitorClient(Base):
    __tablename__ = "competitor_clients"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_domain: Mapped[Optional[str]] = mapped_column(String(255))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    region: Mapped[Optional[str]] = mapped_column(String(100))
    company_size: Mapped[Optional[str]] = mapped_column(String(50))
    relationship_type: Mapped[str] = mapped_column(String(50), default="customer")
    source_url: Mapped[Optional[str]] = mapped_column(String(512))
    confidence: Mapped[Optional[str]] = mapped_column(String(20))

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    company: Mapped["Company"] = relationship(back_populates="competitor_clients")
