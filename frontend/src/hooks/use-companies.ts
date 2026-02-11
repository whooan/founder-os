"use client";

import { useState, useEffect, useCallback } from "react";
import type { Company } from "@/types";
import { fetchCompanies } from "@/lib/api/companies";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { companies, loading, error, refetch: load };
}
