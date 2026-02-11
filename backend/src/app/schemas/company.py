import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class CompanyCreate(BaseModel):
    name: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None
    one_liner: Optional[str] = None
    stage: Optional[str] = None
    hq_location: Optional[str] = None
    employee_range: Optional[str] = None
    founded_year: Optional[int] = None
    social_handles: Optional[dict[str, str]] = None


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    one_liner: Optional[str] = None
    stage: Optional[str] = None
    status: str
    founded_year: Optional[int] = None
    hq_location: Optional[str] = None
    employee_range: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_primary: bool = False
    social_handles: Optional[dict] = None
    founder_count: int = 0
    event_count: int = 0
    funding_round_count: int = 0

    @field_validator("social_handles", mode="before")
    @classmethod
    def parse_social_handles(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v


class CompanyDetail(CompanyRead):
    founders: list["FounderRead"] = []
    funding_rounds: list["FundingRoundRead"] = []
    events: list["EventRead"] = []
    categories: list["MarketCategoryRead"] = []
    products: list["ProductRead"] = []
    social_posts: list["SocialPostRead"] = []
    digests: list["CompanyDigestRead"] = []
    data_sources: list["DataSourceRead"] = []
    media_tone: Optional[dict] = None
    top_topics: Optional[list[str]] = None
    positioning_summary: Optional[str] = None
    gtm_strategy: Optional[str] = None
    key_differentiators: Optional[list[str]] = None
    risk_signals: Optional[list[str]] = None
    competitor_clients: list["CompetitorClientRead"] = []
    icp_analysis: Optional[dict] = None
    geography_analysis: Optional[dict] = None
    industry_focus: Optional[dict] = None
    crosscheck_result: Optional[dict] = None

    @field_validator("media_tone", mode="before")
    @classmethod
    def parse_media_tone(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("top_topics", "key_differentiators", "risk_signals", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("icp_analysis", "geography_analysis", "industry_focus", "crosscheck_result", mode="before")
    @classmethod
    def parse_json_dict(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v


class ComparisonData(BaseModel):
    companies: list["CompanyDetail"] = []
    feature_matrix: dict[str, dict[str, bool]] = {}
    primary_company_id: Optional[str] = None


# Forward refs
from app.schemas.data_source import DataSourceRead  # noqa: E402
from app.schemas.digest import CompanyDigestRead  # noqa: E402
from app.schemas.event import EventRead  # noqa: E402
from app.schemas.founder import FounderRead  # noqa: E402
from app.schemas.funding import FundingRoundRead  # noqa: E402
from app.schemas.market import MarketCategoryRead  # noqa: E402
from app.schemas.product import ProductRead  # noqa: E402
from app.schemas.competitor_client import CompetitorClientRead  # noqa: E402
from app.schemas.social_post import SocialPostRead  # noqa: E402

CompanyDetail.model_rebuild()
ComparisonData.model_rebuild()
