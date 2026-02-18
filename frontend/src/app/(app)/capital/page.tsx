"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Landmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapTableView } from "@/components/capital/cap-table-view";
import { CapTableEvolution } from "@/components/capital/cap-table-evolution";
import { ShareClassManager } from "@/components/capital/share-class-manager";
import { StakeholderTable } from "@/components/capital/stakeholder-table";
import { DocumentsTable } from "@/components/capital/documents-table";
import { CompanyInfoForm } from "@/components/capital/company-info-form";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchCapTableKPIs } from "@/lib/api/captable";
import type { Company, CapTableKPIs } from "@/types";

function formatCurrency(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toLocaleString()}`;
}

export default function CapitalPage() {
  const [primaryCompany, setPrimaryCompany] = useState<Company | null>(null);
  const [kpis, setKpis] = useState<CapTableKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKpis = useCallback(async (companyId: string) => {
    const data = await fetchCapTableKPIs(companyId);
    setKpis(data);
  }, []);

  useEffect(() => {
    fetchCompanies()
      .then((companies) => {
        const primary = companies.find((c) => c.is_primary) ?? companies[0] ?? null;
        setPrimaryCompany(primary);
        if (primary) loadKpis(primary.id);
      })
      .finally(() => setLoading(false));
  }, [loadKpis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!primaryCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <PieChart className="h-10 w-10" />
        <p>No primary company set. Add a company first.</p>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Post-money Valuation",
      value: formatCurrency(kpis?.post_money_valuation ?? null),
      sub: kpis?.last_round_name ? `After ${kpis.last_round_name}` : null,
      icon: TrendingUp,
      color: "text-violet-600",
    },
    {
      label: "Total Raised",
      value: formatCurrency(kpis?.total_raised || null),
      sub: kpis?.rounds_count ? `${kpis.rounds_count} round${kpis.rounds_count > 1 ? "s" : ""}` : null,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Founder Ownership",
      value: kpis?.founder_ownership_pct ? `${kpis.founder_ownership_pct}%` : "—",
      sub: null,
      icon: Percent,
      color: "text-blue-600",
    },
    {
      label: "Shareholders",
      value: kpis?.total_shareholders?.toString() ?? "0",
      sub: kpis?.total_shares ? `${kpis.total_shares.toLocaleString()} shares` : null,
      icon: Users,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Landmark className="h-6 w-6" />
          Capital
        </h1>
        <p className="text-sm text-muted-foreground">
          Cap table, equity holders, legal documents & company info for{" "}
          <span className="font-medium text-foreground">{primaryCompany.name}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{kpi.value}</p>
              {kpi.sub && (
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="captable" className="space-y-4">
        <TabsList>
          <TabsTrigger value="captable">Cap Table</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="captable" className="space-y-6">
          <ShareClassManager companyId={primaryCompany.id} />
          <CapTableView companyId={primaryCompany.id} />
          <CapTableEvolution companyId={primaryCompany.id} />
        </TabsContent>

        <TabsContent value="stakeholders">
          <StakeholderTable companyId={primaryCompany.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTable companyId={primaryCompany.id} />
        </TabsContent>

        <TabsContent value="company-info">
          <CompanyInfoForm companyId={primaryCompany.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
