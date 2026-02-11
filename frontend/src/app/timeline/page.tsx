"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineChart } from "@/components/timeline/timeline-chart";
import { useEvents } from "@/hooks/use-events";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_COLORS,
  formatEventDate,
} from "@/lib/timeline-utils";
import type { EventType, TimelineEvent } from "@/types";

export default function TimelinePage() {
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );

  const filters = useMemo(
    () => ({
      event_type: selectedType === "all" ? undefined : selectedType,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
    [selectedType, startDate, endDate]
  );

  const { events, loading, error } = useEvents(filters);

  const handleEventClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Track events across all your companies over time
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
                className="text-xs"
              >
                All
              </Button>
              {EVENT_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="text-xs gap-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[type] }}
                  />
                  {EVENT_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-36 text-xs"
                placeholder="Start date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-36 text-xs"
                placeholder="End date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex h-[400px] items-center justify-center text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <TimelineChart
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Selected Event Detail */}
      {selectedEvent && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{selectedEvent.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor:
                      EVENT_COLORS[selectedEvent.event_type as EventType],
                    color:
                      EVENT_COLORS[selectedEvent.event_type as EventType],
                  }}
                >
                  {EVENT_TYPE_LABELS[selectedEvent.event_type as EventType]}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatEventDate(selectedEvent.event_date)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEvent(null)}
            >
              Dismiss
            </Button>
          </CardHeader>
          {selectedEvent.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {selectedEvent.description}
              </p>
              {selectedEvent.source_url && (
                <a
                  href={selectedEvent.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-2 inline-block"
                >
                  View source
                </a>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {EVENT_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: EVENT_COLORS[type] }}
            />
            <span className="text-xs text-muted-foreground">
              {EVENT_TYPE_LABELS[type]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
