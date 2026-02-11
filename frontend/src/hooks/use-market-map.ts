"use client";

import { useState, useEffect } from "react";
import type { MarketGraphData } from "@/types";
import { fetchMarketGraph } from "@/lib/api/market";

export function useMarketMap() {
  const [data, setData] = useState<MarketGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchMarketGraph();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to fetch market data"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
