"use client";

import { useState, useEffect, useCallback } from "react";
import type { CompanyDetail } from "@/types";
import { fetchCompany } from "@/lib/api/companies";

export function useCompany(id: string) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompany(id);
      setCompany(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch company"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function doLoad() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCompany(id);
        if (!cancelled) setCompany(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to fetch company"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doLoad();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { company, loading, error, refetch };
}
