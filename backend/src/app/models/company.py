from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.company_digest import CompanyDigest
    from app.models.data_source import DataSource
    from app.models.enrichment_snapshot import EnrichmentSnapshot
    from app.models.event import Event
    from app.models.founder import Founder
    from app.models.funding_round import FundingRound
    from app.models.market_category import MarketCategory
    from app.models.product import Product
    from app.models.competitor_client import CompetitorClient
    from app.models.social_post import SocialPost


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    logo_url: Mapped[Optional[str]] = mapped_column(String(512))
    founded_year: Mapped[Optional[int]]
    hq_location: Mapped[Optional[str]] = mapped_column(String(255))
    employee_range: Mapped[Optional[str]] = mapped_column(String(50))
    stage: Mapped[Optional[str]] = mapped_column(String(50))
    one_liner: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="active")
    is_primary: Mapped[bool] = mapped_column(default=False)
    social_handles: Mapped[Optional[str]] = mapped_column(Text)  # JSON: {"linkedin": "...", "twitter": "..."}

    media_tone: Mapped[Optional[str]] = mapped_column(Text)
    posting_frequency: Mapped[Optional[str]] = mapped_column(Text)
    top_topics: Mapped[Optional[str]] = mapped_column(Text)
    positioning_summary: Mapped[Optional[str]] = mapped_column(Text)
    gtm_strategy: Mapped[Optional[str]] = mapped_column(Text)
    key_differentiators: Mapped[Optional[str]] = mapped_column(Text)
    risk_signals: Mapped[Optional[str]] = mapped_column(Text)

    # Client intelligence fields
    icp_analysis: Mapped[Optional[str]] = mapped_column(Text)  # JSON
    geography_analysis: Mapped[Optional[str]] = mapped_column(Text)  # JSON
    industry_focus: Mapped[Optional[str]] = mapped_column(Text)  # JSON

    # 360° crosscheck result (structured JSON)
    crosscheck_result: Mapped[Optional[str]] = mapped_column(Text)  # JSON

    # Versioning
    data_version: Mapped[int] = mapped_column(default=0)
    last_enriched_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    founders: Mapped[list["Founder"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    funding_rounds: Mapped[list["FundingRound"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    products: Mapped[list["Product"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    data_sources: Mapped[list["DataSource"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    categories: Mapped[list["MarketCategory"]] = relationship(
        secondary="company_categories", back_populates="companies"
    )
    social_posts: Mapped[list["SocialPost"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    digests: Mapped[list["CompanyDigest"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    competitor_clients: Mapped[list["CompetitorClient"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    snapshots: Mapped[list["EnrichmentSnapshot"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
