"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Star,
  GitCompareArrows,
  ArrowRight,
  Rocket,
  MessageSquare,
  Lightbulb,
  Clock,
  Plus,
  Shield,
  MapPin,
  UsersRound,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { PipelineStatusBadge } from "@/components/companies/pipeline-status";
import { useCompanies } from "@/hooks/use-companies";
import { fetchProfile, fetchSettings } from "@/lib/api/settings";
import { fetchCompany } from "@/lib/api/companies";
import { fetchEvents } from "@/lib/api/events";
import type { CompanyDetail, TimelineEvent } from "@/types";

const quickActions = [
  {
    href: "/ask",
    label: "Ask anything",
    description: "Query your intelligence database",
    icon: MessageSquare,
    color: "text-violet-600 bg-violet-500/10",
  },
  {
    href: "/companies",
    label: "Check compset",
    description: "Review competitor activity",
    icon: Building2,
    color: "text-blue-600 bg-blue-500/10",
  },
  {
    href: "/compare",
    label: "Compare",
    description: "Side-by-side analysis",
    icon: GitCompareArrows,
    color: "text-cyan-600 bg-cyan-500/10",
  },
  {
    href: "/timeline",
    label: "Recent events",
    description: "Market signals & news",
    icon: Clock,
    color: "text-amber-600 bg-amber-500/10",
  },
  {
    href: "/suggestions",
    label: "Get insights",
    description: "AI-generated suggestions",
    icon: Lightbulb,
    color: "text-emerald-600 bg-emerald-500/10",
  },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  funding: "Funding",
  launch: "Launch",
  hiring: "Hiring",
  partnership: "Partnership",
  pivot: "Pivot",
  acquisition: "Acquisition",
  executive_change: "Exec Change",
  media_mention: "Media",
  regulatory: "Regulatory",
};

export default function DashboardPage() {
  const { companies, loading, refetch } = useCompanies();
  const [founderName, setFounderName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [primaryDetail, setPrimaryDetail] = useState<CompanyDetail | null>(null);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setFounderName(data.founder_name);
        setOrgName(data.org_name);
      })
      .catch(() => {});
    fetchSettings()
      .then((data) => setLastUpdate(data.last_daily_update))
      .catch(() => {});
  }, []);

  const primaryCompany = companies.find((c) => c.is_primary);
  const competitors = companies.filter((c) => !c.is_primary);

  // Fetch enriched data for primary company
  useEffect(() => {
    if (primaryCompany?.id) {
      fetchCompany(primaryCompany.id)
        .then(setPrimaryDetail)
        .catch(() => {});
      fetchEvents()
        .then((events) => setRecentEvents(events.slice(0, 5)))
        .catch(() => {});
    }
  }, [primaryCompany?.id]);

  const noPrimary = !loading && !primaryCompany;

  const greeting = founderName
    ? `Welcome back, ${founderName}`
    : "Welcome to founderOS";

  const subtitle = orgName
    ? `${orgName} — Market Intelligence`
    : "Founder & Company Intelligence";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{greeting}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>
              Updated{" "}
              {new Date(lastUpdate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Step 1: Define your company */}
      {noPrimary && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-400/20">
              <Rocket className="h-6 w-6 text-violet-600" />
            </div>
            <CardTitle>Define your company</CardTitle>
            <CardDescription>
              Start by adding your own company. founderOS will enrich it with
              web research, social media, and AI analysis — then you can build
              your competitive set.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddCompanyDialog onCompanyAdded={refetch} />
          </CardContent>
        </Card>
      )}

      {/* ── Primary company set: full dashboard ── */}
      {primaryCompany && (
        <>
          {/* My Company — enriched card */}
          <Card className="ring-1 ring-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    My Company
                  </Badge>
                  <CardTitle className="text-xl">{primaryCompany.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <PipelineStatusBadge status={primaryCompany.status} />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/companies/${primaryCompany.id}`}>
                      Full Profile
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              {primaryCompany.one_liner && (
                <p className="text-sm text-muted-foreground mt-1">
                  {primaryCompany.one_liner}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company meta */}
              <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                {primaryCompany.stage && (
                  <Badge variant="outline">{primaryCompany.stage}</Badge>
                )}
                {primaryCompany.hq_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {primaryCompany.hq_location}
                  </span>
                )}
                {primaryCompany.employee_range && (
                  <span className="flex items-center gap-1">
                    <UsersRound className="h-3.5 w-3.5" />
                    {primaryCompany.employee_range} employees
                  </span>
                )}
                {primaryDetail?.crosscheck_result?.confidence_score != null && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Data confidence: {Math.round(primaryDetail.crosscheck_result.confidence_score * 100)}%
                  </span>
                )}
              </div>

              {/* Positioning summary */}
              {primaryDetail?.positioning_summary && (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Positioning</p>
                  <p className="text-sm">{primaryDetail.positioning_summary}</p>
                </div>
              )}

              {/* Key differentiators */}
              {primaryDetail?.key_differentiators && primaryDetail.key_differentiators.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Key differentiators</p>
                  <div className="flex flex-wrap gap-2">
                    {primaryDetail.key_differentiators.slice(0, 5).map((d) => (
                      <Badge key={d} variant="secondary" className="text-xs font-normal">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick stats for my company */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold">{primaryCompany.founder_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Founders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{primaryCompany.event_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{primaryCompany.funding_round_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Rounds</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${action.color} mb-2`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Intelligence overview — two columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Latest Signals</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/timeline">
                      View All
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentEvents.length > 0 ? (
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{event.company_name}</span>
                            {event.event_type && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                              </Badge>
                            )}
                            {event.event_date && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No events yet. Add competitors to start tracking signals.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Compset */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Compset</CardTitle>
                    <CardDescription>
                      {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} tracked
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/companies">
                      View All
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {competitors.length > 0 ? (
                  <div className="space-y-2">
                    {competitors.slice(0, 4).map((company) => (
                      <Link
                        key={company.id}
                        href={`/companies/${company.id}`}
                        className="flex items-center justify-between rounded-md border p-2.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{company.name}</p>
                            {company.one_liner && (
                              <p className="text-xs text-muted-foreground truncate">
                                {company.one_liner}
                              </p>
                            )}
                          </div>
                        </div>
                        <PipelineStatusBadge status={company.status} />
                      </Link>
                    ))}
                    {competitors.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{competitors.length - 4} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      No competitors yet
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/companies">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add competitor
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk signals */}
          {primaryDetail?.risk_signals && primaryDetail.risk_signals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Signals</CardTitle>
                <CardDescription>Competitive threats and vulnerabilities identified by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {primaryDetail.risk_signals.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
