"use client";

import {
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShareClassManager } from "@/components/capital/share-class-manager";
import { CapTableView } from "@/components/capital/cap-table-view";
import { CapTableEvolution } from "@/components/capital/cap-table-evolution";
import { usePrimaryCompany } from "@/hooks/use-primary-company";
import { useCallback, useEffect, useState } from "react";
import { fetchCapTableKPIs } from "@/lib/api/captable";
import type { CapTableKPIs } from "@/types";

function formatCurrency(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toLocaleString()}`;
}

export default function CapTablePage() {
  const { company, loading } = usePrimaryCompany();
  const [kpis, setKpis] = useState<CapTableKPIs | null>(null);

  const loadKpis = useCallback(async (companyId: string) => {
    const data = await fetchCapTableKPIs(companyId);
    setKpis(data);
  }, []);

  useEffect(() => {
    if (company) loadKpis(company.id);
  }, [company, loadKpis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!company) {
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
        <h1 className="text-2xl font-bold">Cap Table</h1>
        <p className="text-sm text-muted-foreground">
          Ownership structure for{" "}
          <span className="font-medium text-foreground">{company.name}</span>
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

      <ShareClassManager companyId={company.id} />
      <CapTableView companyId={company.id} />
      <CapTableEvolution companyId={company.id} />
    </div>
  );
}
