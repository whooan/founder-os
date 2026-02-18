"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Users,
  Compass,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Crosshair,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCompanies } from "@/lib/api/companies";
import { fetchSuggestions, generateSuggestions } from "@/lib/api/suggestions";
import type {
  Company,
  SuggestionsData,
  SuggestedClient,
  ProductSuggestion,
  CEOBriefingItem,
} from "@/types";

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  risk: Shield,
  opportunity: TrendingUp,
  competitor_move: Crosshair,
  market_shift: BarChart3,
};

const CATEGORY_COLORS: Record<string, string> = {
  risk: "bg-red-500/10 text-red-700 border-red-200",
  opportunity: "bg-green-500/10 text-green-700 border-green-200",
  competitor_move: "bg-amber-500/10 text-amber-700 border-amber-200",
  market_shift: "bg-blue-500/10 text-blue-700 border-blue-200",
};

const URGENCY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 border-red-200",
  medium: "bg-amber-500/10 text-amber-700 border-amber-200",
  low: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 border-red-200",
  medium: "bg-amber-500/10 text-amber-700 border-amber-200",
  low: "bg-green-500/10 text-green-700 border-green-200",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "border-green-300 text-green-700",
  medium: "border-amber-300 text-amber-700",
  low: "border-gray-300 text-gray-600",
};

export default function SuggestionsPage() {
  const [primaryCompany, setPrimaryCompany] = useState<Company | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companies = await fetchCompanies();
      const primary = companies.find((c) => c.is_primary);
      setPrimaryCompany(primary || null);

      if (primary) {
        const result = await fetchSuggestions(primary.id);
        if ("potential_customers" in result) {
          setSuggestions(result as SuggestionsData);
        } else {
          setSuggestions(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    if (!primaryCompany) return;
    setGenerating(true);
    try {
      await generateSuggestions(primaryCompany.id);
      // Poll for results after a delay
      setTimeout(async () => {
        try {
          const result = await fetchSuggestions(primaryCompany.id);
          if ("potential_customers" in result) {
            setSuggestions(result as SuggestionsData);
          }
        } catch {
          // ignore
        }
        setGenerating(false);
      }, 15000);
    } catch {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!primaryCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No Primary Company Set</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Set a company as your primary company first to generate strategic
          suggestions based on competitive intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">CEO Intelligence Brief</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Strategic suggestions for{" "}
            <span className="font-semibold">{primaryCompany.name}</span> based
            on competitive analysis
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generating ? "Generating..." : suggestions ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {generating && !suggestions && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
            <div>
              <p className="font-medium">Generating intelligence brief...</p>
              <p className="text-sm text-muted-foreground">
                Analyzing competitor data, client lists, and market trends. This may take a minute.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!suggestions && !generating && (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No suggestions generated yet.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Click &quot;Generate&quot; to create an intelligence brief based on your competitive data.
            </p>
          </CardContent>
        </Card>
      )}

      {suggestions && (
        <>
          {/* Executive Summary */}
          {suggestions.summary && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {suggestions.summary}
                </p>
                {suggestions.analysis_date && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Generated:{" "}
                    {new Date(suggestions.analysis_date).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* CEO Briefing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-4 w-4" />
                CEO Briefing
              </CardTitle>
              <CardDescription>
                Key intelligence items you should know right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.ceo_briefing.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No briefing items available.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestions.ceo_briefing.map(
                    (item: CEOBriefingItem, i: number) => {
                      const Icon =
                        CATEGORY_ICONS[item.category] || AlertCircle;
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  CATEGORY_COLORS[item.category] || ""
                                }`}
                              >
                                {item.category.replace("_", " ")}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  URGENCY_COLORS[item.urgency] || ""
                                }`}
                              >
                                {item.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.content}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Potential Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Potential Customers ({suggestions.potential_customers.length})
              </CardTitle>
              <CardDescription>
                Companies that match your ICP based on competitor client analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.potential_customers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No potential customers identified yet.
                </p>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Company</th>
                        <th className="pb-3 font-medium">Country</th>
                        <th className="pb-3 font-medium">Industry</th>
                        <th className="pb-3 font-medium">Why Good Fit</th>
                        <th className="pb-3 font-medium">Source</th>
                        <th className="pb-3 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suggestions.potential_customers.map(
                        (client: SuggestedClient, i: number) => (
                          <tr
                            key={i}
                            className="border-b last:border-0"
                          >
                            <td className="py-3 font-medium">
                              {client.domain ? (
                                <a
                                  href={
                                    client.domain.startsWith("http")
                                      ? client.domain
                                      : `https://${client.domain}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  {client.company_name}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                client.company_name
                              )}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {client.country}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {client.industry}
                            </td>
                            <td className="py-3 text-muted-foreground max-w-xs">
                              <span className="line-clamp-2">
                                {client.why_good_fit}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground text-xs">
                              {client.source_competitor_client || "—"}
                            </td>
                            <td className="py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${
                                  CONFIDENCE_COLORS[client.confidence] || ""
                                }`}
                              >
                                {client.confidence}
                              </Badge>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Direction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Product Direction ({suggestions.product_suggestions.length})
              </CardTitle>
              <CardDescription>
                Feature and product improvements based on competitive gaps and
                market trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.product_suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No product suggestions available.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {suggestions.product_suggestions.map(
                    (sug: ProductSuggestion, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            {sug.suggestion}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ml-2 ${
                              PRIORITY_COLORS[sug.priority] || ""
                            }`}
                          >
                            {sug.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sug.rationale}
                        </p>
                        {sug.source_evidence && (
                          <p className="text-xs text-muted-foreground/60 italic">
                            Evidence: {sug.source_evidence}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
