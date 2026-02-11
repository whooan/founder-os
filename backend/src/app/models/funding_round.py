from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.investor import Investor


class FundingRound(Base):
    __tablename__ = "funding_rounds"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    round_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount_usd: Mapped[Optional[int]] = mapped_column(Integer)
    date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    announcement_url: Mapped[Optional[str]] = mapped_column(String(512))

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship(back_populates="funding_rounds")
    investors: Mapped[list["Investor"]] = relationship(
        secondary="round_investors", back_populates="funding_rounds"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
