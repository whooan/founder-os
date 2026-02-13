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


class ProductFeature(BaseModel):
    product_name: str
    features: list[str] = []
    description: Optional[str] = None


class ProductFeaturesResult(BaseModel):
    products: list[ProductFeature] = []
    sources: list[SourceReference] = []


class SocialDigestResult(BaseModel):
    summary: str
    key_themes: list[str] = []
    notable_posts: list[str] = []
    sentiment: str = "neutral"  # positive/neutral/negative
    activity_level: str = "low"  # high/medium/low
    sources: list[SourceReference] = []


class CompanyDigestResult(BaseModel):
    executive_summary: str
    strengths: list[str] = []
    weaknesses: list[str] = []
    opportunities: list[str] = []
    threats: list[str] = []
    cross_check_findings: list[str] = []  # data confirmed across multiple sources
    confidence_notes: list[str] = []  # where data is thin
    sources: list[SourceReference] = []


# Pipeline: Client Intelligence
class DiscoveredClient(BaseModel):
    client_name: str
    client_domain: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    company_size: Optional[str] = None  # startup, smb, mid-market, enterprise
    relationship_type: str = "customer"  # customer, partner, integration
    confidence: str = "medium"  # high, medium, low


class ICPProfile(BaseModel):
    target_segments: list[str] = []
    ideal_company_size: str = ""
    ideal_industries: list[str] = []
    buyer_persona: str = ""
    pain_points: list[str] = []
    buying_criteria: list[str] = []


class GeographyBreakdown(BaseModel):
    primary_markets: list[str] = []
    expansion_markets: list[str] = []
    hq_region: str = ""
    market_presence_notes: str = ""


class IndustryFocus(BaseModel):
    primary_industries: list[str] = []
    secondary_industries: list[str] = []
    vertical_strength: str = ""
    industry_notes: str = ""


class ClientIntelligenceResult(BaseModel):
    clients: list[DiscoveredClient] = []
    icp: ICPProfile = ICPProfile()
    geography: GeographyBreakdown = GeographyBreakdown()
    industry: IndustryFocus = IndustryFocus()
    sources: list[SourceReference] = []


class CrossCheckResult(BaseModel):
    validated_facts: list[str] = []  # confirmed by 2+ sources
    contradictions: list[str] = []  # conflicting data
    data_gaps: list[str] = []  # missing important info
    confidence_score: float = 0.0  # 0.0 to 1.0
    recommendations: list[str] = []  # what to verify manually
    consolidated_summary: str = ""  # the 360 view
    sources: list[SourceReference] = []
    # Validated canonical fields (written back to Company)
    positioning_summary: str = ""
    gtm_strategy: str = ""
    key_differentiators: list[str] = []
    risk_signals: list[str] = []
    top_topics: list[str] = []


class PotentialClient(BaseModel):
    company_name: str
    domain: Optional[str] = None
    country: str = ""
    industry: str = ""
    why_good_fit: str = ""
    equivalent_competitor_client: Optional[str] = None
    confidence: str = "medium"


class PotentialClientsResult(BaseModel):
    analysis_summary: str = ""
    potential_clients: list[PotentialClient] = []
    methodology: str = ""
    sources: list[SourceReference] = []


# ── Feature Consolidation (Compare) ─────────────────────────

class ConsolidatedFeature(BaseModel):
    canonical_name: str  # e.g., "OCR / Document Recognition"
    original_names: list[str] = []
    category: str = ""  # "common", "my_unique", "competitor_unique", "partial"
    companies_with_feature: list[str] = []  # company IDs that have it


class ConsolidatedFeatureResult(BaseModel):
    features: list[ConsolidatedFeature] = []
    summary: str = ""


# ── Quadrant Visualization ───────────────────────────────────

class AxisPair(BaseModel):
    x_label: str
    y_label: str
    description: str = ""


class CompanyScore(BaseModel):
    company_id: str
    company_name: str
    x_score: float  # 0-100
    y_score: float  # 0-100
    rationale: str = ""


class QuadrantResult(BaseModel):
    axis_pairs: list[AxisPair] = []
    scores: dict[str, list[CompanyScore]] = {}  # keyed by "x_label|y_label"


# ── CEO Suggestions ──────────────────────────────────────────

class SuggestedClient(BaseModel):
    company_name: str
    domain: Optional[str] = None
    country: str = ""
    industry: str = ""
    why_good_fit: str = ""
    source_competitor_client: Optional[str] = None
    confidence: str = "medium"


class ProductSuggestion(BaseModel):
    suggestion: str
    rationale: str = ""
    priority: str = "medium"  # high, medium, low
    source_evidence: str = ""


class CEOBriefingItem(BaseModel):
    title: str
    content: str = ""
    category: str = ""  # risk, opportunity, competitor_move, market_shift
    urgency: str = "medium"


class SuggestionsResult(BaseModel):
    potential_customers: list[SuggestedClient] = []
    product_suggestions: list[ProductSuggestion] = []
    ceo_briefing: list[CEOBriefingItem] = []
    analysis_date: str = ""
    summary: str = ""
