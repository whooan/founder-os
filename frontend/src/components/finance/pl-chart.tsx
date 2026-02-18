"use client";

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MonthlySummary } from "@/types";

type TimeFilter = "3M" | "6M" | "12M" | "YTD" | "ALL";

function formatLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function formatK(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(Math.round(v));
}

function filterByTime(data: MonthlySummary[], filter: TimeFilter): MonthlySummary[] {
  if (filter === "ALL") return data;

  const now = new Date();
  let cutoff: string;

  if (filter === "YTD") {
    cutoff = `${now.getFullYear()}-01`;
  } else {
    const months = filter === "3M" ? 3 : filter === "6M" ? 6 : 12;
    const d = new Date(now.getFullYear(), now.getMonth() - months, 1);
    cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  return data.filter((d) => d.year_month >= cutoff);
}

const GREEN = "hsl(142, 71%, 45%)";
const GREEN_FADED = "hsl(142, 40%, 70%)";
const RED = "hsl(0, 84%, 60%)";
const RED_FADED = "hsl(0, 50%, 78%)";
const BLUE = "hsl(217, 91%, 60%)";
const PURPLE = "hsl(270, 60%, 55%)";

const TIME_FILTERS: TimeFilter[] = ["3M", "6M", "12M", "YTD", "ALL"];

export function PlChart({ data }: { data: MonthlySummary[] }) {
  const [filter, setFilter] = useState<TimeFilter>("12M");

  const filtered = filterByTime(data, filter);
  const hasForecast = filtered.some((d) => d.is_forecast);
  const firstForecastIdx = filtered.findIndex((d) => d.is_forecast);

  const chartData = filtered.map((d) => ({
    month: formatLabel(d.year_month),
    Income: d.income,
    Expenses: -d.expenses, // negative so bars point down
    Net: d.net,
    isForecast: d.is_forecast,
    ProjectedCash: d.projected_cash ?? undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>P&L Trend</CardTitle>
            {hasForecast && (
              <span className="text-xs text-muted-foreground font-normal px-2 py-0.5 bg-muted rounded-full">
                Faded = forecast
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {TIME_FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis
              yAxisId="left"
              tickFormatter={formatK}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            {hasForecast && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatK}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
            )}
            <Tooltip
              formatter={(value: number | undefined) =>
                value != null
                  ? `\u20ac${Math.abs(value).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                  : ""
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--border))" />
            {firstForecastIdx > 0 && (
              <ReferenceLine
                x={chartData[firstForecastIdx]?.month}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
                yAxisId="left"
              />
            )}
            <Bar dataKey="Income" yAxisId="left" radius={[4, 4, 0, 0]} stackId="stack">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isForecast ? GREEN_FADED : GREEN} />
              ))}
            </Bar>
            <Bar dataKey="Expenses" yAxisId="left" radius={[0, 0, 4, 4]} stackId="stack2">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isForecast ? RED_FADED : RED} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="Net"
              yAxisId="left"
              stroke={BLUE}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            {hasForecast && (
              <Line
                type="monotone"
                dataKey="ProjectedCash"
                yAxisId="right"
                stroke={PURPLE}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 2 }}
                name="Projected Cash"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
