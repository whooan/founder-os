from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.allocation import Allocation
    from app.models.company import Company


class ShareClass(Base):
    __tablename__ = "share_classes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    votes_per_share: Mapped[int] = mapped_column(Integer, default=1)
    liquidation_preference: Mapped[Optional[str]] = mapped_column(String(50))
    seniority: Mapped[int] = mapped_column(Integer, default=0)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship()

    allocations: Mapped[list["Allocation"]] = relationship(
        back_populates="share_class"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
