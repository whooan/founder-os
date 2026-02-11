"use client";

import Link from "next/link";
import {
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Star,
  GitCompareArrows,
  ArrowRight,
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

const statCards = [
  {
    title: "Companies",
    icon: Building2,
    valueKey: "companies" as const,
  },
  {
    title: "Founders",
    icon: Users,
    valueKey: "founders" as const,
  },
  {
    title: "Events",
    icon: Calendar,
    valueKey: "events" as const,
  },
  {
    title: "Funding Rounds",
    icon: TrendingUp,
    valueKey: "funding" as const,
  },
];

export default function DashboardPage() {
  const { companies, loading, refetch } = useCompanies();

  const primaryCompany = companies.find((c) => c.is_primary);
  const competitors = companies.filter((c) => !c.is_primary);

  const stats = {
    companies: companies.length,
    founders: companies.reduce((sum, c) => sum + (c.founder_count || 0), 0),
    events: companies.reduce((sum, c) => sum + (c.event_count || 0), 0),
    funding: companies.reduce((sum, c) => sum + (c.funding_round_count || 0), 0),
  };

  const isEmpty = !loading && companies.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SignalMap</h2>
          <p className="text-muted-foreground">
            Competitive Intelligence Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {companies.length >= 2 && (
            <Button asChild variant="outline">
              <Link href="/compare">
                <GitCompareArrows className="mr-2 h-4 w-4" />
                Compare
              </Link>
            </Button>
          )}
          <AddCompanyDialog onCompanyAdded={refetch} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "--" : stats[stat.valueKey]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEmpty && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Get started with SignalMap</CardTitle>
            <CardDescription>
              Add your company first, then add competitors to compare. We&apos;ll
              automatically enrich profiles with data from web, social media,
              and AI analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddCompanyDialog onCompanyAdded={refetch} />
          </CardContent>
        </Card>
      )}

      {/* Primary Company Card */}
      {primaryCompany && (
        <Card className="ring-1 ring-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  My Company
                </Badge>
                <CardTitle>{primaryCompany.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <PipelineStatusBadge status={primaryCompany.status} />
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/companies/${primaryCompany.id}`}>
                    View Details
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
            {primaryCompany.one_liner && (
              <CardDescription>{primaryCompany.one_liner}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              {primaryCompany.stage && (
                <Badge variant="outline" className="text-xs">
                  {primaryCompany.stage}
                </Badge>
              )}
              {primaryCompany.hq_location && (
                <span className="text-xs text-muted-foreground">
                  {primaryCompany.hq_location}
                </span>
              )}
              {primaryCompany.employee_range && (
                <span className="text-xs text-muted-foreground">
                  {primaryCompany.employee_range} employees
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitors */}
      {!isEmpty && !loading && competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {primaryCompany ? "Competitors" : "Companies"}
            </CardTitle>
            <CardDescription>
              {primaryCompany
                ? "Companies being tracked for competitive intelligence"
                : "Your tracked companies — set one as primary to enable comparison"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitors.slice(0, 10).map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{company.name}</p>
                      {company.one_liner && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {company.one_liner}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PipelineStatusBadge status={company.status} />
                    {company.stage && (
                      <Badge variant="outline" className="text-xs">
                        {company.stage}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show primary as recent if no competitors */}
      {!isEmpty && !loading && primaryCompany && competitors.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <GitCompareArrows className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">
              Add a competitor to start comparing
            </p>
            <AddCompanyDialog onCompanyAdded={refetch} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
