import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class FounderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    bio: Optional[str] = None
    previous_companies: Optional[list[str]] = None
    education: Optional[list[str]] = None
    company_id: str
    created_at: datetime

    @field_validator("previous_companies", "education", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v


class FounderUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    bio: Optional[str] = None
