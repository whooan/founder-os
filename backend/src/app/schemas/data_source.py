from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DataSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    title: Optional[str] = None
    source_type: str
    content_snippet: Optional[str] = None
    last_fetched: Optional[datetime] = None
    company_id: str
    created_at: datetime
