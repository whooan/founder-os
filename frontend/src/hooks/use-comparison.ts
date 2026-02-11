"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComparisonData } from "@/types";
import { fetchComparisonData } from "@/lib/api/companies";

export function useComparison(companyIds: string[]) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (companyIds.length === 0) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchComparisonData(companyIds);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch comparison data"
      );
    } finally {
      setLoading(false);
    }
  }, [companyIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
