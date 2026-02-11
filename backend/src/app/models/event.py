from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(50))
    event_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    source_url: Mapped[Optional[str]] = mapped_column(String(512))
    source_type: Mapped[Optional[str]] = mapped_column(String(50))
    sentiment: Mapped[Optional[str]] = mapped_column(String(20))
    significance: Mapped[Optional[int]] = mapped_column(Integer)
    raw_content: Mapped[Optional[str]] = mapped_column(Text)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship(back_populates="events")
    founder_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("founders.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
