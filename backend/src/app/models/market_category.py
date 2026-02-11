from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company import Company


class MarketCategory(Base):
    __tablename__ = "market_categories"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text)

    companies: Mapped[list["Company"]] = relationship(
        secondary="company_categories", back_populates="categories"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
