from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InvestorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


class FundingRoundRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    round_name: str
    amount_usd: Optional[int] = None
    date: Optional[datetime] = None
    announcement_url: Optional[str] = None
    company_id: str
    investors: list[InvestorRead] = []
    created_at: datetime
