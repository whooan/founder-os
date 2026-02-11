"use client";

import { Building2, Calendar, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
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

  const stats = {
    companies: companies.length,
    founders: 0,
    events: 0,
    funding: 0,
  };

  const isEmpty = !loading && companies.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SignalMap</h2>
          <p className="text-muted-foreground">
            Founder & Company Intelligence Platform
          </p>
        </div>
        <AddCompanyDialog onCompanyAdded={refetch} />
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
              Add a company to begin tracking founders, funding rounds, and
              market signals. We will automatically enrich the profile with data
              from multiple sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AddCompanyDialog onCompanyAdded={refetch} />
          </CardContent>
        </Card>
      )}

      {!isEmpty && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
            <CardDescription>
              Your most recently added companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.slice(0, 5).map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-md border p-3"
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
                  {company.stage && (
                    <span className="text-xs text-muted-foreground">
                      {company.stage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
