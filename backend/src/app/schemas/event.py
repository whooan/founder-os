from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: Optional[str] = None
    event_type: str
    event_date: Optional[datetime] = None
    source_url: Optional[str] = None
    source_type: Optional[str] = None
    sentiment: Optional[str] = None
    significance: Optional[int] = None
    company_id: str
    founder_id: Optional[str] = None
    raw_content: Optional[str] = None
    created_at: datetime
