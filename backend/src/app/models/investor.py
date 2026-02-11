from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.funding_round import FundingRound


class Investor(Base):
    __tablename__ = "investors"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(512))
    description: Mapped[Optional[str]] = mapped_column(Text)

    funding_rounds: Mapped[list["FundingRound"]] = relationship(
        secondary="round_investors", back_populates="investors"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
