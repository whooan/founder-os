from typing import Optional

from pydantic import BaseModel


class AskQuery(BaseModel):
    question: str
    company_id: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: list[dict] = []


class PipelineStatusResponse(BaseModel):
    status: str
    company_id: str
