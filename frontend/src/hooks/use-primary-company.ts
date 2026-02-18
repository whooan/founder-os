"use client";

import { useState, useEffect } from "react";
import type { Company } from "@/types";
import { fetchCompanies } from "@/lib/api/companies";

export function usePrimaryCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies()
      .then((companies) => {
        const primary = companies.find((c) => c.is_primary) ?? companies[0] ?? null;
        setCompany(primary);
      })
      .finally(() => setLoading(false));
  }, []);

  return { company, loading };
}
