from sqlalchemy import Column, ForeignKey, String, Table

from app.models.base import Base

company_categories = Table(
    "company_categories",
    Base.metadata,
    Column("company_id", String(36), ForeignKey("companies.id"), primary_key=True),
    Column("category_id", String(36), ForeignKey("market_categories.id"), primary_key=True),
)

round_investors = Table(
    "round_investors",
    Base.metadata,
    Column("round_id", String(36), ForeignKey("funding_rounds.id"), primary_key=True),
    Column("investor_id", String(36), ForeignKey("investors.id"), primary_key=True),
)
