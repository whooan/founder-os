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
}

export interface CompanyDetail extends Company {
  founders: Founder[];
  funding_rounds: FundingRound[];
  events: TimelineEvent[];
  categories: MarketCategory[];
  media_tone: Record<string, string> | null;
  top_topics: string[] | null;
}

export interface Founder {
  id: string;
  name: string;
  title: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  bio: string | null;
  previous_companies: string[] | null;
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
  company_id: string;
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
