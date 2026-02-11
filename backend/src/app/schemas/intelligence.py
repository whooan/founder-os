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


class CompareQuery(BaseModel):
    company_ids: list[str]
    question: str


class CompareResponse(BaseModel):
    answer: str
    sources: list[dict] = []


class AddSourceRequest(BaseModel):
    url: str
    title: Optional[str] = None
