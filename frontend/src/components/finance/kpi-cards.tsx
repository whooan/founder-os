"use client";

import { Wallet, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FinanceKPIs, ForecastSettings } from "@/types";

function fmt(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

function runwayLabel(months: number | null): string {
  if (months == null) return "\u2014";
  if (months > 120) return ">10yr";
  if (months >= 12) {
    const yr = Math.floor(months / 12);
    const mo = Math.round(months % 12);
    return mo > 0 ? `${yr}yr ${mo}mo` : `${yr}yr`;
  }
  return `${months} mo`;
}

export function KpiCards({
  kpis,
  forecast,
}: {
  kpis: FinanceKPIs;
  forecast: ForecastSettings;
}) {
  const { burn_rates, runway_scenarios } = kpis;
  const hasForecast = forecast.monthly_burn > 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Cash */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-emerald-500/10 p-2.5">
            <Wallet className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash Position</p>
            <p className="text-2xl font-semibold tracking-tight">
              {"\u20ac"}{fmt(kpis.cash_position)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Runway — forecast headline + scenarios */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Timer className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {hasForecast ? "Runway (forecast)" : "Runway (worst)"}
              </p>
              <p className="text-2xl font-semibold tracking-tight">
                {runwayLabel(hasForecast ? runway_scenarios.forecast : runway_scenarios.worst)}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasForecast
                  ? `at ${"\u20ac"}${fmt(forecast.monthly_burn)}/mo burn`
                  : "zero income, 6mo avg burn"}
              </p>
            </div>
          </div>
          <div className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Worst (zero income)</span>
              <span className="font-medium text-foreground">{runwayLabel(runway_scenarios.worst)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current (burn − income)</span>
              <span className="font-medium text-foreground">{runwayLabel(runway_scenarios.current)}</span>
            </div>
            <div className="flex justify-between">
              <span>Best (12mo net avg)</span>
              <span className="font-medium text-foreground">{runwayLabel(runway_scenarios.best)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Burn — worst case (expenses only, zero income) */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Burn (no income)</p>
              <p className="text-2xl font-semibold tracking-tight">
                {"\u20ac"}{fmt(burn_rates.six_month)}
              </p>
            </div>
          </div>
          <div className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>3 month avg</span>
              <span className="font-medium text-foreground">{"\u20ac"}{fmt(burn_rates.three_month)}</span>
            </div>
            <div className="flex justify-between">
              <span>6 month avg</span>
              <span className="font-medium text-foreground">{"\u20ac"}{fmt(burn_rates.six_month)}</span>
            </div>
            <div className="flex justify-between">
              <span>12 month avg</span>
              <span className="font-medium text-foreground">{"\u20ac"}{fmt(burn_rates.twelve_month)}</span>
            </div>
            {hasForecast && (
              <div className="flex justify-between">
                <span>Forecast burn</span>
                <span className="font-medium text-foreground">{"\u20ac"}{fmt(forecast.monthly_burn)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Month Income</p>
              <p className="text-2xl font-semibold tracking-tight">
                {"\u20ac"}{fmt(kpis.monthly_income)}
              </p>
            </div>
          </div>
          {hasForecast && (
            <div className="border-t border-border pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Forecast income</span>
                <span className="font-medium text-foreground">{"\u20ac"}{fmt(forecast.monthly_income)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
