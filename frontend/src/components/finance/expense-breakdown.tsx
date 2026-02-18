"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseCategory } from "@/types";

const EXPENSE_COLORS = [
  "hsl(0, 84%, 60%)",
  "hsl(20, 90%, 55%)",
  "hsl(40, 96%, 50%)",
  "hsl(60, 70%, 45%)",
  "hsl(80, 60%, 45%)",
  "hsl(100, 50%, 45%)",
  "hsl(150, 50%, 45%)",
  "hsl(200, 70%, 50%)",
  "hsl(250, 60%, 55%)",
  "hsl(300, 50%, 50%)",
];

const INCOME_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(160, 70%, 40%)",
  "hsl(180, 60%, 40%)",
  "hsl(200, 70%, 50%)",
  "hsl(220, 70%, 55%)",
  "hsl(240, 60%, 55%)",
  "hsl(260, 50%, 55%)",
  "hsl(280, 50%, 50%)",
  "hsl(300, 50%, 50%)",
  "hsl(320, 60%, 50%)",
];

function fmt(v: number): string {
  if (v >= 1_000_000) return `\u20ac${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `\u20ac${(v / 1_000).toFixed(0)}K`;
  return `\u20ac${v.toFixed(0)}`;
}

interface TreemapNode {
  [key: string]: string | number;
  name: string;
  size: number;
  count: number;
  fill: string;
}

function TreemapCell(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  size: number;
  fill: string;
}) {
  const { x, y, width, height, name, size, fill } = props;
  if (width < 4 || height < 4) return null;

  const showLabel = width > 50 && height > 30;
  const showValue = width > 50 && height > 48;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showValue ? -7 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white text-[11px] font-medium"
          style={{ pointerEvents: "none" }}
        >
          {width < 90 ? name.slice(0, 12) + (name.length > 12 ? "…" : "") : name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white/80 text-[10px]"
          style={{ pointerEvents: "none" }}
        >
          {fmt(size)}
        </text>
      )}
    </g>
  );
}

function BreakdownTreemap({
  title,
  data,
  colors,
}: {
  title: string;
  data: ExpenseCategory[];
  colors: string[];
}) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No data yet
        </CardContent>
      </Card>
    );
  }

  const treeData: TreemapNode[] = data.map((d, i) => ({
    name: d.category,
    size: d.total,
    count: d.transaction_count,
    fill: colors[i % colors.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={treeData}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<TreemapCell x={0} y={0} width={0} height={0} name="" size={0} fill="" />}
          >
            <Tooltip
              formatter={(value: number | undefined) =>
                value != null
                  ? `\u20ac${value.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`
                  : ""
              }
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ExpenseBreakdown({
  expenses,
  income,
}: {
  expenses: ExpenseCategory[];
  income: ExpenseCategory[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BreakdownTreemap title="Expenses by Category" data={expenses} colors={EXPENSE_COLORS} />
      <BreakdownTreemap title="Income Sources" data={income} colors={INCOME_COLORS} />
    </div>
  );
}
