"use client";

import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompanyDetail } from "@/types";

interface FundingComparisonProps {
  companies: CompanyDetail[];
  primaryCompanyId: string | null;
}

export function FundingComparison({
  companies,
  primaryCompanyId,
}: FundingComparisonProps) {
  const totals = companies.map((c) => ({
    company: c,
    total: c.funding_rounds.reduce(
      (sum, r) => sum + (r.amount_usd || 0),
      0
    ),
    rounds: c.funding_rounds.length,
  }));

  const maxTotal = Math.max(...totals.map((t) => t.total), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funding Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {totals.map(({ company, total, rounds }) => (
            <div key={company.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-sm font-medium ${
                    company.id === primaryCompanyId ? "text-primary" : ""
                  }`}
                >
                  {company.name}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {rounds} round{rounds !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-sm font-medium flex items-center gap-0.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {total > 0
                      ? `${(total / 1_000_000).toFixed(1)}M`
                      : "Undisclosed"}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    company.id === primaryCompanyId
                      ? "bg-primary"
                      : "bg-muted-foreground/40"
                  }`}
                  style={{
                    width: `${total > 0 ? (total / maxTotal) * 100 : 0}%`,
                  }}
                />
              </div>
              {company.funding_rounds.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {company.funding_rounds.map((r) => (
                    <span
                      key={r.id}
                      className="text-[10px] text-muted-foreground"
                    >
                      {r.round_name}
                      {r.amount_usd
                        ? ` ($${(r.amount_usd / 1_000_000).toFixed(1)}M)`
                        : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
