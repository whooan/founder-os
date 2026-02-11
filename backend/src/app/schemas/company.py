import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class CompanyCreate(BaseModel):
    name: str


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


class CompanyDetail(CompanyRead):
    founders: list["FounderRead"] = []
    funding_rounds: list["FundingRoundRead"] = []
    events: list["EventRead"] = []
    categories: list["MarketCategoryRead"] = []
    products: list["ProductRead"] = []
    data_sources: list["DataSourceRead"] = []
    media_tone: Optional[dict] = None
    top_topics: Optional[list[str]] = None
    positioning_summary: Optional[str] = None
    gtm_strategy: Optional[str] = None
    key_differentiators: Optional[list[str]] = None
    risk_signals: Optional[list[str]] = None

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


# Forward refs
from app.schemas.data_source import DataSourceRead  # noqa: E402
from app.schemas.event import EventRead  # noqa: E402
from app.schemas.founder import FounderRead  # noqa: E402
from app.schemas.funding import FundingRoundRead  # noqa: E402
from app.schemas.market import MarketCategoryRead  # noqa: E402
from app.schemas.product import ProductRead  # noqa: E402

CompanyDetail.model_rebuild()
