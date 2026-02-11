import { apiFetch } from "@/lib/api";
import type { TimelineEvent, EventType } from "@/types";

export interface EventFilters {
  event_type?: EventType;
  start_date?: string;
  end_date?: string;
  company_id?: string;
}

export async function fetchEvents(
  filters?: EventFilters
): Promise<TimelineEvent[]> {
  const params = new URLSearchParams();
  if (filters?.event_type) params.set("event_type", filters.event_type);
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);
  if (filters?.company_id) params.set("company_id", filters.company_id);

  const query = params.toString();
  const path = query ? `/events?${query}` : "/events";
  return apiFetch<TimelineEvent[]>(path);
}
