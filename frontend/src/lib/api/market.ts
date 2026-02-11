import { apiFetch } from "@/lib/api";
import type { MarketGraphData } from "@/types";

export async function fetchMarketGraph(): Promise<MarketGraphData> {
  return apiFetch<MarketGraphData>("/market/graph");
}
