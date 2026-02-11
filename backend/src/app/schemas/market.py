from typing import Optional

from pydantic import BaseModel, ConfigDict


class MarketCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None


class MarketGraphNode(BaseModel):
    id: str
    label: str
    type: str  # "company", "investor", "category"
    size: float


class MarketGraphLink(BaseModel):
    source: str
    target: str
    type: str  # "invested_in", "same_category", "competitor"
    weight: float


class MarketGraphData(BaseModel):
    nodes: list[MarketGraphNode]
    links: list[MarketGraphLink]
