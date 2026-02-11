"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  running: {
    label: "Enriching...",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  enriched: {
    label: "Enriched",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

interface PipelineStatusBadgeProps {
  status: string;
}

export function PipelineStatusBadge({ status }: PipelineStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {status === "running" && (
        <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      )}
      {config.label}
    </Badge>
  );
}
