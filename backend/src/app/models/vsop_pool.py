from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.share_class import ShareClass
    from app.models.vsop_grant import VsopGrant


class VsopPool(Base):
    __tablename__ = "vsop_pools"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    total_shares: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    company_id: Mapped[str] = mapped_column(
        ForeignKey("companies.id"), unique=True
    )
    company: Mapped["Company"] = relationship()

    share_class_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("share_classes.id")
    )
    share_class: Mapped[Optional["ShareClass"]] = relationship()

    grants: Mapped[list["VsopGrant"]] = relationship(
        back_populates="pool", cascade="all, delete-orphan"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
