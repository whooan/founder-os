from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SocialPostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: str
    author: Optional[str] = None
    content: Optional[str] = None
    url: str
    posted_at: Optional[datetime] = None
    raw_content_md: Optional[str] = None
    company_id: str
    founder_id: Optional[str] = None
    created_at: datetime
