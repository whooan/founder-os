"use client";

import { useState, useEffect } from "react";
import type { CompanyDetail } from "@/types";
import { fetchCompany } from "@/lib/api/companies";

export function useCompany(id: string) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { company, loading, error };
}
