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
  EVENT_COLORS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  eventTypeToYIndex,
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

export function TimelineChart({ events, onEventClick }: TimelineChartProps) {
  const chartData = useMemo(() => {
    return events
      .filter((e) => e.event_date)
      .map((event) => ({
        x: new Date(event.event_date!).getTime(),
        y: eventTypeToYIndex(event.event_type),
        z: (event.significance ?? 5) * 20,
        event,
      }));
  }, [events]);

  const yTickFormatter = (value: number) => {
    const type = EVENT_TYPES[value];
    return type ? EVENT_TYPE_LABELS[type] : "";
  };

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

    return (
      <div className="rounded-lg border bg-card p-3 shadow-md">
        <p className="font-semibold text-sm">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {EVENT_TYPE_LABELS[event.event_type]} &middot;{" "}
          {formatEventDate(event.event_date)}
        </p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-[250px] line-clamp-2">
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

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
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
          domain={[-0.5, EVENT_TYPES.length - 0.5]}
          tickFormatter={yTickFormatter}
          ticks={EVENT_TYPES.map((_, i) => i)}
          name="Type"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          width={90}
        />
        <ZAxis type="number" dataKey="z" range={[40, 400]} />
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
              fill={EVENT_COLORS[entry.event.event_type]}
              fillOpacity={0.8}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
