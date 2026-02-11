from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    launch_date: Mapped[Optional[datetime]] = mapped_column(DateTime)

    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id"))
    company: Mapped["Company"] = relationship(back_populates="products")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
