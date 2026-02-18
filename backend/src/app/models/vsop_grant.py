from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.stakeholder import Stakeholder
    from app.models.vsop_pool import VsopPool


class VsopGrant(Base):
    __tablename__ = "vsop_grants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    shares_granted: Mapped[int] = mapped_column(Integer, nullable=False)
    strike_price: Mapped[Optional[float]] = mapped_column(Float)
    grant_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    cliff_months: Mapped[int] = mapped_column(Integer, default=12)
    vesting_months: Mapped[int] = mapped_column(Integer, default=48)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )  # active | terminated | fully_vested
    notes: Mapped[Optional[str]] = mapped_column(Text)

    pool_id: Mapped[str] = mapped_column(ForeignKey("vsop_pools.id"))
    pool: Mapped["VsopPool"] = relationship(back_populates="grants")

    stakeholder_id: Mapped[str] = mapped_column(ForeignKey("stakeholders.id"))
    stakeholder: Mapped["Stakeholder"] = relationship()

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
