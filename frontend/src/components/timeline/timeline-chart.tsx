"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TimelineEvent } from "@/types";
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
} from "@/lib/timeline-utils";

interface TimelineChartProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
}

interface ChartDataPoint {
  x: number;
  y: number;
  z: number;
  event: TimelineEvent;
}

/** Build a favicon URL for a company domain using Google's service */
function faviconUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  // Strip protocol and trailing slashes
  const clean = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=32`;
}

/** Custom Y-axis tick that renders a favicon + company name */
function CompanyTick({
  x,
  y,
  payload,
  companies,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  companies: { name: string; domain: string | null }[];
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const company = companies[payload.value];
  if (!company) return null;

  const favicon = faviconUrl(company.domain);

  return (
    <g transform={`translate(${x},${y})`}>
      {favicon && (
        <image
          href={favicon}
          x={-140}
          y={-10}
          width={20}
          height={20}
          style={{ borderRadius: 4 }}
        />
      )}
      <text
        x={-112}
        y={0}
        dy={5}
        textAnchor="start"
        fill="hsl(var(--muted-foreground))"
        fontSize={12}
        fontWeight={500}
      >
        {company.name.length > 16
          ? company.name.slice(0, 16) + "..."
          : company.name}
      </text>
    </g>
  );
}

export function TimelineChart({ events, onEventClick }: TimelineChartProps) {
  // Build unique company list (sorted alphabetically) for Y-axis
  const companies = useMemo(() => {
    const map = new Map<
      string,
      { name: string; domain: string | null; companyId: string }
    >();
    events.forEach((e) => {
      if (!map.has(e.company_id)) {
        map.set(e.company_id, {
          name: e.company_name || "Unknown",
          domain: e.company_domain || null,
          companyId: e.company_id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [events]);

  // Map company_id → y index
  const companyToY = useMemo(() => {
    const m: Record<string, number> = {};
    companies.forEach((c, i) => {
      m[c.companyId] = i;
    });
    return m;
  }, [companies]);

  const chartData = useMemo(() => {
    return events
      .filter((e) => e.event_date)
      .map((event) => ({
        x: new Date(event.event_date!).getTime(),
        y: companyToY[event.company_id] ?? 0,
        z: (event.significance ?? 5) * 20,
        event,
      }));
  }, [events, companyToY]);

  const xTickFormatter = (value: number) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ payload: ChartDataPoint }>;
  }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const event = data.event;
    const favicon = faviconUrl(event.company_domain);

    return (
      <div className="rounded-lg border bg-card p-3 shadow-md max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              width={16}
              height={16}
              className="rounded-sm"
            />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {event.company_name}
          </span>
        </div>
        <p className="font-semibold text-sm">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {EVENT_TYPE_LABELS[event.event_type] || event.event_type} &middot;{" "}
          {formatEventDate(event.event_date)}
        </p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No events to display
      </div>
    );
  }

  const chartHeight = Math.max(300, companies.length * 50 + 60);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 150 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={["auto", "auto"]}
          tickFormatter={xTickFormatter}
          name="Date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[-0.5, companies.length - 0.5]}
          ticks={companies.map((_, i) => i)}
          tick={(props: Record<string, unknown>) => (
            <CompanyTick {...props} companies={companies} />
          )}
          name="Company"
          stroke="hsl(var(--muted-foreground))"
          width={145}
          interval={0}
        />
        <ZAxis type="number" dataKey="z" range={[40, 300]} />
        <Tooltip
          content={renderTooltip}
          cursor={{ strokeDasharray: "3 3" }}
        />
        <Scatter
          data={chartData}
          onClick={(data: ChartDataPoint) => onEventClick?.(data.event)}
          cursor="pointer"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill="hsl(var(--foreground))"
              fillOpacity={0.6}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
