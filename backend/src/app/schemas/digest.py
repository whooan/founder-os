from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyDigestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    digest_markdown: str
    digest_type: str
    generated_at: datetime
    company_id: str
