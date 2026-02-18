"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineChart } from "@/components/timeline/timeline-chart";
import { useEvents } from "@/hooks/use-events";
import { fetchCompanies } from "@/lib/api/companies";
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
} from "@/lib/timeline-utils";
import type { Company, EventType, TimelineEvent } from "@/types";

/** Build a favicon URL for a company domain */
function faviconUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=32`;
}

export default function TimelinePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set()
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );

  // Load companies on mount and auto-select all
  useEffect(() => {
    fetchCompanies()
      .then((data) => {
        setCompanies(data);
        setSelectedCompanyIds(new Set(data.map((c) => c.id)));
      })
      .catch(() => {});
  }, []);

  const filters = useMemo(
    () => ({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
    [startDate, endDate]
  );

  const { events, loading, error } = useEvents(filters);

  // Filter events by selected companies (client-side)
  const filteredEvents = useMemo(() => {
    if (selectedCompanyIds.size === 0) return [];
    return events.filter((e) => selectedCompanyIds.has(e.company_id));
  }, [events, selectedCompanyIds]);

  const toggleCompany = useCallback((id: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCompanyIds(new Set(companies.map((c) => c.id)));
  }, [companies]);

  const selectNone = useCallback(() => {
    setSelectedCompanyIds(new Set());
  }, []);

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
              <span className="text-sm font-medium">Companies:</span>
            </div>

            <div className="flex flex-wrap gap-1">
              <Button
                variant={
                  selectedCompanyIds.size === companies.length
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={selectAll}
                className="text-xs"
              >
                All
              </Button>
              <Button
                variant={
                  selectedCompanyIds.size === 0 ? "default" : "outline"
                }
                size="sm"
                onClick={selectNone}
                className="text-xs"
              >
                None
              </Button>
              {companies.map((company) => {
                const isSelected = selectedCompanyIds.has(company.id);
                const favicon = faviconUrl(company.domain);
                return (
                  <Button
                    key={company.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCompany(company.id)}
                    className="text-xs gap-1.5"
                  >
                    {favicon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={favicon}
                        alt=""
                        width={14}
                        height={14}
                        className="rounded-sm"
                      />
                    )}
                    {company.name}
                  </Button>
                );
              })}
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
              events={filteredEvents}
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
              <div className="flex items-center gap-2 mb-1">
                {selectedEvent.company_domain && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      faviconUrl(selectedEvent.company_domain) || ""
                    }
                    alt=""
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedEvent.company_name}
                </span>
              </div>
              <CardTitle className="text-base">
                {selectedEvent.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {EVENT_TYPE_LABELS[
                    selectedEvent.event_type as EventType
                  ] || selectedEvent.event_type}
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
    </div>
  );
}
