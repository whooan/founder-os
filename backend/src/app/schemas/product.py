from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    launch_date: Optional[datetime] = None
    company_id: str
    created_at: datetime
