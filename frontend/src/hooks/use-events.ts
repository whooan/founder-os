"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimelineEvent } from "@/types";
import { fetchEvents, type EventFilters } from "@/lib/api/events";

export function useEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(filters);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, refetch: load };
}
