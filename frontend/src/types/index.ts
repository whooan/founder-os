export interface Company {
  id: string;
  name: string;
  domain: string | null;
  description: string | null;
  one_liner: string | null;
  stage: string | null;
  status: string;
  founded_year: number | null;
  hq_location: string | null;
  employee_range: string | null;
  created_at: string;
  updated_at: string;
  is_primary: boolean;
  social_handles: Record<string, string> | null;
  founder_count: number;
  event_count: number;
  funding_round_count: number;
  data_version: number;
  last_enriched_at: string | null;
}

export interface CompanyDetail extends Company {
  founders: Founder[];
  funding_rounds: FundingRound[];
  events: TimelineEvent[];
  categories: MarketCategory[];
  products: Product[];
  data_sources: DataSource[];
  social_posts: SocialPost[];
  digests: CompanyDigest[];
  media_tone: Record<string, string> | null;
  top_topics: string[] | null;
  positioning_summary: string | null;
  gtm_strategy: string | null;
  key_differentiators: string[] | null;
  risk_signals: string[] | null;
  competitor_clients: CompetitorClient[];
  icp_analysis: {
    target_segments: string[];
    ideal_company_size: string;
    ideal_industries: string[];
    buyer_persona: string;
    pain_points: string[];
    buying_criteria: string[];
  } | null;
  geography_analysis: {
    primary_markets: string[];
    expansion_markets: string[];
    hq_region: string;
    market_presence_notes: string;
  } | null;
  industry_focus: {
    primary_industries: string[];
    secondary_industries: string[];
    vertical_strength: string;
    industry_notes: string;
  } | null;
  crosscheck_result: {
    confidence_score: number;
    validated_facts: string[];
    contradictions: string[];
    data_gaps: string[];
    recommendations: string[];
    consolidated_summary: string;
  } | null;
}

export interface Founder {
  id: string;
  name: string;
  title: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  bio: string | null;
  previous_companies: string[] | null;
  education: string[] | null;
  company_id: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  event_date: string | null;
  source_url: string | null;
  source_type: string | null;
  sentiment: string | null;
  significance: number | null;
  company_id: string;
  company_name: string;
  company_domain: string | null;
  raw_content: string | null;
}

export interface FundingRound {
  id: string;
  round_name: string;
  amount_usd: number | null;
  date: string | null;
  investors: Investor[];
  company_id: string;
}

export interface Investor {
  id: string;
  name: string;
  type: string | null;
}

export interface MarketCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  launch_date: string | null;
  features: string[] | null;
  company_id: string;
}

export interface DataSource {
  id: string;
  url: string;
  title: string | null;
  source_type: string;
  content_snippet: string | null;
  raw_content: string | null;
  raw_content_md: string | null;
  is_custom: boolean;
  last_fetched: string | null;
  company_id: string;
}

export interface SocialPost {
  id: string;
  platform: string;
  author: string | null;
  content: string | null;
  url: string | null;
  posted_at: string | null;
  raw_content_md: string | null;
  company_id: string;
  founder_id: string | null;
  created_at: string | null;
}

export interface CompanyDigest {
  id: string;
  digest_markdown: string;
  digest_type: string;
  generated_at: string | null;
  company_id: string;
}

export interface CompetitorClient {
  id: string;
  client_name: string;
  client_domain: string | null;
  industry: string | null;
  region: string | null;
  company_size: string | null;
  relationship_type: string;
  source_url: string | null;
  confidence: string | null;
  company_id: string;
}

export interface ComparisonData {
  companies: CompanyDetail[];
  feature_matrix: Record<string, Record<string, boolean>>;
  primary_company_id: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { label: string; url: string }[];
  timestamp: string;
}

export interface AskResponse {
  answer: string;
  sources: { label: string; url: string }[];
}

export interface MarketGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: "company" | "investor" | "category";
  size: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "invested_in" | "same_category" | "competitor";
  weight: number;
}

export type EventType =
  | "funding"
  | "launch"
  | "hiring"
  | "partnership"
  | "pivot"
  | "acquisition"
  | "executive_change"
  | "media_mention"
  | "regulatory";

export type PipelineStatus = "pending" | "running" | "enriched" | "error";

/**
 * Safely parse a value that may be a JSON string or already an array.
 * Handles cases where the backend returns JSON-encoded arrays as strings
 * (e.g. from the compare endpoint which bypasses Pydantic validators).
 */
export function safeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON
    }
  }
  return [];
}

// ── Versioning ──────────────────────────────────────────────

export interface EnrichmentSnapshot {
  id: string;
  version: number;
  snapshot_data: Record<string, unknown>;
  changes_summary: string | null;
  created_at: string | null;
}

// ── Consolidated Feature Comparison ─────────────────────────

export interface ConsolidatedFeature {
  canonical_name: string;
  original_names: string[];
  category: "common" | "my_unique" | "competitor_unique" | "partial";
  companies_with_feature: string[];
}

export interface ConsolidatedComparisonData {
  companies: CompanyDetail[];
  consolidated_features: ConsolidatedFeature[];
  summary: string;
  primary_company_id: string | null;
}

// ── Quadrant Visualization ──────────────────────────────────

export interface AxisPair {
  x_label: string;
  y_label: string;
  description: string;
}

export interface CompanyScore {
  company_id: string;
  company_name: string;
  x_score: number;
  y_score: number;
  rationale: string;
}

export interface QuadrantData {
  axis_pairs: AxisPair[];
  scores: Record<string, CompanyScore[]>;
  primary_company_id: string | null;
}

// ── Conversations ───────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  company_id: string | null;
  message_count?: number;
  messages?: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ── Capital / Cap Table ─────────────────────────────────────

export interface ShareClass {
  id: string;
  name: string;
  votes_per_share: number;
  liquidation_preference: string | null;
  seniority: number;
  created_at: string | null;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "founder" | "employee" | "angel" | "vc" | "other";
  entity_name: string | null;
  contact_person: string | null;
  partner_emails: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface Allocation {
  id: string;
  stakeholder_id: string;
  stakeholder_name: string | null;
  share_class_id: string;
  share_class_name: string | null;
  shares: number;
  amount_invested: number | null;
  ownership_pct: number;
  notes: string | null;
}

export interface EquityEvent {
  id: string;
  name: string;
  event_type: string;
  date: string | null;
  pre_money_valuation: number | null;
  amount_raised: number | null;
  price_per_share: number | null;
  total_shares_after: number | null;
  notes: string | null;
  allocations: Allocation[];
  created_at: string | null;
}

export interface CapTableRow {
  stakeholder: Stakeholder;
  shares_by_class: Record<string, number>;
  total_shares: number;
  ownership_pct: number;
  total_invested: number;
}

export interface CapTableSnapshot {
  rows: CapTableRow[];
  total_shares: number;
  share_classes: ShareClass[];
}

export interface CapTableEvolutionEntry {
  event: EquityEvent;
  snapshot: CapTableRow[];
}

export interface CapTableKPIs {
  last_valuation: number | null;
  post_money_valuation: number | null;
  total_raised: number;
  total_shareholders: number;
  founder_ownership_pct: number;
  total_shares: number;
  rounds_count: number;
  last_round_name: string | null;
}

// ── VSOP ────────────────────────────────────────────────────

export interface VsopPool {
  id: string;
  name: string;
  total_shares: number;
  share_class_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VsopGrant {
  id: string;
  stakeholder_id: string;
  stakeholder_name: string | null;
  shares_granted: number;
  strike_price: number | null;
  grant_date: string | null;
  cliff_months: number;
  vesting_months: number;
  status: "active" | "terminated" | "fully_vested";
  notes: string | null;
  vested_shares: number;
  unvested_shares: number;
  vesting_pct: number;
  cliff_met: boolean;
  created_at: string | null;
}

export interface VsopSummary {
  pool: VsopPool | null;
  grants: VsopGrant[];
  total_granted: number;
  total_available: number;
  total_vested: number;
  total_unvested: number;
  pool_utilization_pct: number;
  overall_vesting_pct: number;
}

export interface LegalDocument {
  id: string;
  title: string;
  doc_type: string;
  date: string | null;
  summary: string | null;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface CompanyLegal {
  id: string;
  company_id: string;
  legal_name: string | null;
  cif: string | null;
  registered_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  registration_number: string | null;
  registration_date: string | null;
  notary: string | null;
  protocol_number: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ── Finance ─────────────────────────────────────────────────

export interface TreasuryAccount {
  id: string;
  holded_id: string;
  name: string;
  account_type: string;
  balance: number;
  iban: string | null;
  currency: string;
}

export interface MonthlySummary {
  year_month: string;
  income: number;
  expenses: number;
  net: number;
  is_forecast: boolean;
  projected_cash?: number;
}

export interface ExpenseCategory {
  category: string;
  contact_name?: string | null;
  total: number;
  transaction_count: number;
}

export interface BurnRates {
  three_month: number;
  six_month: number;
  twelve_month: number;
}

export interface ForecastSettings {
  monthly_burn: number;
  monthly_income: number;
}

export interface RunwayScenarios {
  worst: number | null;
  current: number | null;
  best: number | null;
  forecast: number | null;
}

export interface FinanceKPIs {
  cash_position: number;
  monthly_burn: number;
  monthly_income: number;
  runway_months: number | null;
  runway_scenarios: RunwayScenarios;
  net_last_month: number;
  burn_rates: BurnRates;
}

export interface FinanceDashboard {
  kpis: FinanceKPIs;
  monthly_summary: MonthlySummary[];
  expense_breakdown: ExpenseCategory[];
  income_sources: ExpenseCategory[];
  treasury_accounts: TreasuryAccount[];
  last_synced: string | null;
  forecast: ForecastSettings;
}

export interface HoldedConnectionTest {
  success: boolean;
  message: string;
  accounts_found: number;
}

export interface SyncStatus {
  status: string;
  step: string;
  progress: number;
}

export interface CategoryRule {
  id: string;
  contact_name: string;
  category: string;
  is_auto: boolean;
}

export interface PlannedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  quarter: string | null;
  is_recurring: boolean;
  notes: string | null;
}

// ── CEO Suggestions ─────────────────────────────────────────

export interface SuggestedClient {
  company_name: string;
  domain: string | null;
  country: string;
  industry: string;
  why_good_fit: string;
  source_competitor_client: string | null;
  confidence: string;
}

export interface ProductSuggestion {
  suggestion: string;
  rationale: string;
  priority: string;
  source_evidence: string;
}

export interface CEOBriefingItem {
  title: string;
  content: string;
  category: "risk" | "opportunity" | "competitor_move" | "market_shift";
  urgency: string;
}

export interface SuggestionsData {
  potential_customers: SuggestedClient[];
  product_suggestions: ProductSuggestion[];
  ceo_briefing: CEOBriefingItem[];
  analysis_date: string;
  summary: string;
}
