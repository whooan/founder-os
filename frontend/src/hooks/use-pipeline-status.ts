"use client";

import { useState, useEffect, useRef } from "react";
import type { PipelineStatus } from "@/types";
import { fetchCompanyStatus } from "@/lib/api/companies";

export function usePipelineStatus(companyId: string, initialStatus?: string) {
  const [status, setStatus] = useState<PipelineStatus>(
    (initialStatus as PipelineStatus) || "pending"
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "enriched" || status === "error") {
      return;
    }

    async function poll() {
      try {
        const data = await fetchCompanyStatus(companyId);
        setStatus(data.status as PipelineStatus);
      } catch {
        // Silently fail and keep polling
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [companyId, status]);

  return status;
}
