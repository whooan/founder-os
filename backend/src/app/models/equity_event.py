from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.allocation import Allocation
    from app.models.company import Company


class EquityEvent(Base):
    __tablename__ = "equity_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    pre_money_valuation: Mapped[Optional[float]] = mapped_column(Float)
    amount_raised: Mapped[Optional[float]] = mapped_column(Float)
    price_per_share: Mapped[Optional[float]] = mapped_column(Float)
    total_shares_after: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship()

    allocations: Mapped[list["Allocation"]] = relationship(
        back_populates="equity_event", cascade="all, delete-orphan"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
