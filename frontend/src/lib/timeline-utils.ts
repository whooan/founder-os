import type { EventType } from "@/types";

export const EVENT_COLORS: Record<EventType, string> = {
  funding: "#22c55e",
  launch: "#3b82f6",
  hiring: "#a855f7",
  partnership: "#f59e0b",
  pivot: "#ef4444",
  acquisition: "#ec4899",
  executive_change: "#6366f1",
  media_mention: "#64748b",
  regulatory: "#78716c",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  funding: "Funding",
  launch: "Launch",
  hiring: "Hiring",
  partnership: "Partnership",
  pivot: "Pivot",
  acquisition: "Acquisition",
  executive_change: "Executive Change",
  media_mention: "Media Mention",
  regulatory: "Regulatory",
};

export const EVENT_TYPES: EventType[] = [
  "funding",
  "launch",
  "hiring",
  "partnership",
  "pivot",
  "acquisition",
  "executive_change",
  "media_mention",
  "regulatory",
];

export function eventTypeToYIndex(type: EventType): number {
  return EVENT_TYPES.indexOf(type);
}

export function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
