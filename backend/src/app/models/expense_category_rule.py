import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ExpenseCategoryRule(Base):
    __tablename__ = "expense_category_rules"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    contact_name: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100))
    is_auto: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
