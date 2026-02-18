"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCapTableEvolution } from "@/lib/api/captable";
import type { CapTableEvolutionEntry } from "@/types";

const COLORS = [
  "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
];

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toLocaleString()}`;
}

interface CapTableEvolutionProps {
  companyId: string;
}

export function CapTableEvolution({ companyId }: CapTableEvolutionProps) {
  const [evolution, setEvolution] = useState<CapTableEvolutionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchCapTableEvolution(companyId);
    setEvolution(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading evolution...
        </CardContent>
      </Card>
    );
  }

  if (evolution.length === 0) return null;

  // Build chart data: each event is an x-axis entry, with stakeholder ownership %
  const allStakeholders = new Map<string, string>();
  for (const entry of evolution) {
    for (const row of entry.snapshot) {
      allStakeholders.set(row.stakeholder.id, row.stakeholder.name);
    }
  }
  const stakeholderIds = Array.from(allStakeholders.keys());
  const stakeholderNames = Array.from(allStakeholders.values());

  const chartData = evolution.map((entry) => {
    const point: Record<string, string | number> = { name: entry.event.name };
    for (const sid of stakeholderIds) {
      const row = entry.snapshot.find((r) => r.stakeholder.id === sid);
      point[sid] = row ? row.ownership_pct : 0;
    }
    return point;
  });

  const eventTypeBadge: Record<string, string> = {
    incorporation: "bg-violet-100 text-violet-700",
    funding_round: "bg-blue-100 text-blue-700",
    grant: "bg-green-100 text-green-700",
    secondary: "bg-amber-100 text-amber-700",
    conversion: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="space-y-6">
      {/* Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              {stakeholderIds.map((sid, i) => (
                <Bar
                  key={sid}
                  dataKey={sid}
                  name={stakeholderNames[i]}
                  stackId="ownership"
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evolution.map((entry) => {
              const isExpanded = expandedEvent === entry.event.id;
              return (
                <div
                  key={entry.event.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() =>
                      setExpandedEvent(isExpanded ? null : entry.event.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.event.name}</span>
                          <Badge
                            variant="secondary"
                            className={
                              eventTypeBadge[entry.event.event_type] ??
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {entry.event.event_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.event.date)}
                          </span>
                          {entry.event.pre_money_valuation && (
                            <span>
                              Pre-money: {formatCurrency(entry.event.pre_money_valuation)}
                            </span>
                          )}
                          {entry.event.amount_raised && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Raised: {formatCurrency(entry.event.amount_raised)}
                            </span>
                          )}
                          {entry.event.pre_money_valuation && entry.event.amount_raised && (
                            <span className="font-medium text-foreground">
                              Post-money: {formatCurrency(
                                entry.event.pre_money_valuation + entry.event.amount_raised
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && entry.event.allocations.length > 0 && (
                    <div className="mt-3 ml-7 border-t pt-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="pb-1 text-left font-medium">Stakeholder</th>
                            <th className="pb-1 text-left font-medium">Share Class</th>
                            <th className="pb-1 text-right font-medium">Shares</th>
                            <th className="pb-1 text-right font-medium">Invested</th>
                            <th className="pb-1 text-right font-medium">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.event.allocations.map((alloc) => (
                            <tr key={alloc.id} className="border-t">
                              <td className="py-1">{alloc.stakeholder_name}</td>
                              <td className="py-1">{alloc.share_class_name}</td>
                              <td className="py-1 text-right tabular-nums">
                                {alloc.shares.toLocaleString()}
                              </td>
                              <td className="py-1 text-right tabular-nums">
                                {alloc.amount_invested
                                  ? formatCurrency(alloc.amount_invested)
                                  : "—"}
                              </td>
                              <td className="py-1 text-right tabular-nums">
                                {alloc.ownership_pct}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
