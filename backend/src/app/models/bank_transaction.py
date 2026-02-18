import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    holded_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    treasury_holded_id: Mapped[str | None] = mapped_column(
        String(255), index=True, nullable=True
    )
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(String(1000), default="")
    contact_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    year_month: Mapped[str] = mapped_column(String(7), index=True)  # "YYYY-MM"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
