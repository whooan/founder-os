from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompetitorClientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    client_name: str
    client_domain: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    company_size: Optional[str] = None
    relationship_type: str = "customer"
    source_url: Optional[str] = None
    confidence: Optional[str] = None
    company_id: str
