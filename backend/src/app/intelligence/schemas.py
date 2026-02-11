from typing import Optional

from pydantic import BaseModel


class SourceReference(BaseModel):
    url: str
    title: Optional[str] = None
    snippet: Optional[str] = None


# Pipeline 1: Discovery
class DiscoveredFounder(BaseModel):
    name: str
    title: str
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    bio: Optional[str] = None
    previous_companies: list[str] = []


class DiscoveredFunding(BaseModel):
    round_name: str
    amount_usd: Optional[int] = None
    date: Optional[str] = None
    investors: list[str] = []


class CompanyDiscoveryResult(BaseModel):
    name: str
    domain: Optional[str] = None
    description: str
    one_liner: str
    founded_year: Optional[int] = None
    hq_location: Optional[str] = None
    employee_range: Optional[str] = None
    stage: Optional[str] = None
    founders: list[DiscoveredFounder] = []
    funding_rounds: list[DiscoveredFunding] = []
    products: list[str] = []
    market_categories: list[str] = []
    sources: list[SourceReference] = []


# Pipeline 2: Media Fingerprint
class MediaFingerprint(BaseModel):
    tone: str
    posting_frequency: str
    primary_channels: list[str]
    top_topics: list[str]
    audience_engagement: str
    content_style: str
    sources: list[SourceReference] = []


# Pipeline 3: Event Extraction
class ExtractedEvent(BaseModel):
    title: str
    description: str
    event_type: str
    event_date: Optional[str] = None
    source_url: Optional[str] = None
    sentiment: str
    significance: int


class EventExtractionResult(BaseModel):
    events: list[ExtractedEvent]
    sources: list[SourceReference] = []


# Pipeline 4: Market Intelligence
class MarketIntelligence(BaseModel):
    positioning_summary: str
    competitive_landscape: list[str]
    gtm_strategy: str
    key_differentiators: list[str]
    market_trends: list[str]
    risk_signals: list[str]
    sources: list[SourceReference] = []
