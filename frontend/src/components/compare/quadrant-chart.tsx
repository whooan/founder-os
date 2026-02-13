"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuadrantData, CompanyScore } from "@/types";

interface QuadrantChartProps {
  data: QuadrantData | null;
  loading?: boolean;
}

// Assign distinct colors per company
const COMPANY_COLORS = [
  "#3b82f6", // blue (primary)
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

interface ScatterPayloadItem {
  payload: CompanyScore & { color: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<ScatterPayloadItem>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md max-w-xs">
      <p className="font-semibold text-sm">{item.company_name}</p>
      <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>
      <div className="flex gap-4 mt-2 text-xs">
        <span>
          X: <strong>{item.x_score}</strong>
        </span>
        <span>
          Y: <strong>{item.y_score}</strong>
        </span>
      </div>
    </div>
  );
}

export function QuadrantChart({ data, loading }: QuadrantChartProps) {
  const [selectedAxisIdx, setSelectedAxisIdx] = useState(0);

  if (loading || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Generating strategic quadrant...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data.axis_pairs || data.axis_pairs.length === 0) {
    return null;
  }

  const axis = data.axis_pairs[selectedAxisIdx];
  const axisKey = `${axis.x_label}|${axis.y_label}`;

  // Fuzzy key lookup: try exact match first, then find a key that contains both labels
  let scores = data.scores[axisKey] || [];
  if (scores.length === 0) {
    // Try all keys in the scores dict
    const allKeys = Object.keys(data.scores);
    // Fallback: try matching key for this axis index
    if (allKeys.length > selectedAxisIdx) {
      scores = data.scores[allKeys[selectedAxisIdx]] || [];
    }
    // Last resort: try first available key with data
    if (scores.length === 0) {
      for (const k of allKeys) {
        if (data.scores[k]?.length > 0) {
          scores = data.scores[k];
          break;
        }
      }
    }
  }

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Strategic Landscape</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No quadrant data available. The AI may not have generated scores for
          these companies.
        </CardContent>
      </Card>
    );
  }

  // Assign colors
  const colorMap: Record<string, string> = {};
  scores.forEach((s, i) => {
    if (s.company_id === data.primary_company_id) {
      colorMap[s.company_id] = COMPANY_COLORS[0];
    } else {
      colorMap[s.company_id] =
        COMPANY_COLORS[(i % (COMPANY_COLORS.length - 1)) + 1];
    }
  });

  const chartData = scores.map((s) => ({
    ...s,
    color: colorMap[s.company_id] || "#94a3b8",
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base">Strategic Landscape</CardTitle>
          <div className="flex gap-1.5">
            {data.axis_pairs.map((ap, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAxisIdx(idx)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedAxisIdx === idx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
                title={ap.description}
              >
                {ap.x_label} vs {ap.y_label}
              </button>
            ))}
          </div>
        </div>
        {axis.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {axis.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="x_score"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              >
                <Label
                  value={axis.x_label}
                  position="bottom"
                  offset={10}
                  style={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="y_score"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              >
                <Label
                  value={axis.y_label}
                  angle={-90}
                  position="left"
                  offset={10}
                  style={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
              </YAxis>
              <ReferenceLine
                x={50}
                stroke="var(--border)"
                strokeDasharray="5 5"
              />
              <ReferenceLine
                y={50}
                stroke="var(--border)"
                strokeDasharray="5 5"
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter data={chartData} name="Companies">
                {chartData.map((entry) => (
                  <Cell
                    key={entry.company_id}
                    fill={entry.color}
                    r={entry.company_id === data.primary_company_id ? 10 : 7}
                    stroke={
                      entry.company_id === data.primary_company_id
                        ? entry.color
                        : "transparent"
                    }
                    strokeWidth={
                      entry.company_id === data.primary_company_id ? 3 : 0
                    }
                    opacity={
                      entry.company_id === data.primary_company_id ? 1 : 0.8
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {chartData.map((entry) => (
            <div
              key={entry.company_id}
              className="flex items-center gap-1.5 text-xs"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className={
                  entry.company_id === data.primary_company_id
                    ? "font-semibold"
                    : "text-muted-foreground"
                }
              >
                {entry.company_name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
