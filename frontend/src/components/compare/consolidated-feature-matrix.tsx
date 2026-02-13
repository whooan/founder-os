"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Info,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConsolidatedComparisonData, CompanyDetail } from "@/types";

interface ConsolidatedFeatureMatrixProps {
  data: ConsolidatedComparisonData;
  loading?: boolean;
}

const CATEGORY_CONFIG = {
  common: {
    label: "Common",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    icon: MinusCircle,
    description: "All companies have this feature",
  },
  my_unique: {
    label: "My Advantage",
    color: "bg-green-500/10 text-green-700 border-green-200",
    icon: CheckCircle2,
    description: "Only your company has this",
  },
  competitor_unique: {
    label: "Competitor Only",
    color: "bg-red-500/10 text-red-700 border-red-200",
    icon: XCircle,
    description: "Competitors have this, you don't",
  },
  partial: {
    label: "Partial",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    icon: Info,
    description: "Some companies have this",
  },
};

type CategoryFilter =
  | "all"
  | "common"
  | "my_unique"
  | "competitor_unique"
  | "partial";

export function ConsolidatedFeatureMatrix({
  data,
  loading,
}: ConsolidatedFeatureMatrixProps) {
  const [filter, setFilter] = useState<CategoryFilter>("all");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Consolidating features with AI...
          </span>
        </CardContent>
      </Card>
    );
  }

  const features = data.consolidated_features || [];
  const filtered =
    filter === "all" ? features : features.filter((f) => f.category === filter);

  // Build company name map
  const companyNameMap: Record<string, string> = {};
  data.companies.forEach((c: CompanyDetail) => {
    companyNameMap[c.id] = c.name;
  });

  // Count by category
  const counts = {
    all: features.length,
    common: features.filter((f) => f.category === "common").length,
    my_unique: features.filter((f) => f.category === "my_unique").length,
    competitor_unique: features.filter(
      (f) => f.category === "competitor_unique"
    ).length,
    partial: features.filter((f) => f.category === "partial").length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Consolidated Feature Analysis
          </CardTitle>
          <div className="flex gap-1.5">
            {(
              [
                "all",
                "my_unique",
                "competitor_unique",
                "common",
                "partial",
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat === "all"
                  ? `All (${counts.all})`
                  : `${
                      CATEGORY_CONFIG[cat].label
                    } (${counts[cat]})`}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {data.summary && (
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {data.summary}
          </div>
        )}

        {/* Feature Table */}
        <TooltipProvider>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium w-1/4">Feature</th>
                  <th className="pb-3 font-medium w-32">Category</th>
                  {data.companies.map((c: CompanyDetail) => (
                    <th key={c.id} className="pb-3 font-medium text-center">
                      <span className="truncate block max-w-[120px]">
                        {c.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((feature) => {
                  const config = CATEGORY_CONFIG[feature.category];
                  const Icon = config.icon;
                  return (
                    <tr key={feature.canonical_name} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-start gap-2">
                          <span className="font-medium">
                            {feature.canonical_name}
                          </span>
                          {feature.original_names.length > 1 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-medium mb-1">
                                  Also known as:
                                </p>
                                {feature.original_names.map((n) => (
                                  <p key={n} className="text-xs">
                                    {n}
                                  </p>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={`text-xs ${config.color}`}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      {data.companies.map((c: CompanyDetail) => {
                        const has = feature.companies_with_feature.includes(
                          c.id
                        );
                        const isPrimary = c.id === data.primary_company_id;
                        return (
                          <td key={c.id} className="py-3 text-center">
                            {has ? (
                              <CheckCircle2
                                className={`h-5 w-5 mx-auto ${
                                  isPrimary
                                    ? "text-green-600"
                                    : "text-green-500/70"
                                }`}
                              />
                            ) : (
                              <XCircle
                                className={`h-5 w-5 mx-auto ${
                                  isPrimary
                                    ? "text-red-500"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TooltipProvider>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No features match this filter.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
