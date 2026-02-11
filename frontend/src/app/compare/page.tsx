"use client";

import { useState, useEffect } from "react";
import {
  GitCompareArrows,
  Loader2,
  Star,
  MessageSquare,
  PanelRightOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanySelector } from "@/components/compare/company-selector";
import { FeatureMatrix } from "@/components/compare/feature-matrix";
import { FundingComparison } from "@/components/compare/funding-comparison";
import { TeamComparison } from "@/components/compare/team-comparison";
import { ComparisonChat } from "@/components/compare/comparison-chat";
import { useComparison } from "@/hooks/use-comparison";
import { fetchCompanies } from "@/lib/api/companies";
import type { Company } from "@/types";

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const { data, loading, error } = useComparison(selectedIds);

  // Auto-select primary company on mount
  useEffect(() => {
    fetchCompanies()
      .then((companies) => {
        const primary = companies.find((c: Company) => c.is_primary);
        if (primary) {
          setSelectedIds([primary.id]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <GitCompareArrows className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Compare</h2>
            </div>
            <p className="text-muted-foreground mt-1">
              Side-by-side competitive intelligence across companies, products,
              teams, and funding.
            </p>
          </div>
          {data && data.companies.length > 0 && (
            <Button
              variant={chatOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="gap-2"
            >
              {chatOpen ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {chatOpen ? "Close Chat" : "Chat"}
            </Button>
          )}
        </div>

        {/* Company Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySelector
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {/* No selection state */}
        {!loading && !error && selectedIds.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GitCompareArrows className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Select at least one company to start comparing.
              </p>
              <p className="text-xs text-muted-foreground">
                Your primary company will be auto-selected if one is set.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comparison Data */}
        {data && data.companies.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.companies.map((company) => (
                <Card
                  key={company.id}
                  className={
                    company.id === data.primary_company_id
                      ? "ring-1 ring-primary"
                      : ""
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {company.name}
                      </CardTitle>
                      {company.id === data.primary_company_id && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
                          <Star className="mr-0.5 h-2.5 w-2.5 fill-current" />
                          Mine
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {company.one_liner && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {company.one_liner}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {company.stage && (
                        <Badge variant="outline" className="text-[10px]">
                          {company.stage}
                        </Badge>
                      )}
                      {company.hq_location && (
                        <Badge variant="secondary" className="text-[10px]">
                          {company.hq_location}
                        </Badge>
                      )}
                      {company.employee_range && (
                        <Badge variant="secondary" className="text-[10px]">
                          {company.employee_range}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {company.founders.length} founder
                        {company.founders.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {company.data_sources?.length || 0} sources
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Matrix */}
            <FeatureMatrix
              featureMatrix={data.feature_matrix}
              companies={data.companies}
              primaryCompanyId={data.primary_company_id}
            />

            {/* Funding Comparison */}
            <FundingComparison
              companies={data.companies}
              primaryCompanyId={data.primary_company_id}
            />

            {/* Team Comparison */}
            <TeamComparison
              companies={data.companies}
              primaryCompanyId={data.primary_company_id}
            />
          </>
        )}
      </div>

      {/* Right chat panel */}
      {chatOpen && data && data.companies.length > 0 && (
        <div className="w-[400px] border-l bg-background shrink-0 flex flex-col">
          <ComparisonChat
            companyIds={selectedIds}
            panelMode
            onClose={() => setChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
