from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.equity_event import EquityEvent
    from app.models.share_class import ShareClass
    from app.models.stakeholder import Stakeholder


class Allocation(Base):
    __tablename__ = "allocations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    shares: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_invested: Mapped[Optional[float]] = mapped_column(Float)
    ownership_pct: Mapped[float] = mapped_column(Float, default=0.0)
    is_diluted_from_previous: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    equity_event_id: Mapped[str] = mapped_column(ForeignKey("equity_events.id"))
    equity_event: Mapped["EquityEvent"] = relationship(back_populates="allocations")

    stakeholder_id: Mapped[str] = mapped_column(ForeignKey("stakeholders.id"))
    stakeholder: Mapped["Stakeholder"] = relationship(back_populates="allocations")

    share_class_id: Mapped[str] = mapped_column(ForeignKey("share_classes.id"))
    share_class: Mapped["ShareClass"] = relationship(back_populates="allocations")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
