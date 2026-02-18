"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KpiCards } from "@/components/finance/kpi-cards";
import { PlChart } from "@/components/finance/pl-chart";
import { ExpenseBreakdown } from "@/components/finance/expense-breakdown";
import { TreasuryAccounts } from "@/components/finance/treasury-accounts";
import { ForecastSettingsPanel } from "@/components/finance/forecast-settings";
import { CategoryManager } from "@/components/finance/category-manager";
import { PlannedExpensesPanel } from "@/components/finance/planned-expenses";
import {
  fetchFinanceDashboard,
  triggerFinanceSync,
  fetchSyncStatus,
} from "@/lib/api/finance";
import type { FinanceDashboard } from "@/types";

export default function FinancePage() {
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState("");
  const [syncProgress, setSyncProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchFinanceDashboard();
      setData(d);
    } catch {
      setError("Failed to load financial data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadDashboard]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStep("Starting sync...");
    setSyncProgress(5);
    setError(null);

    try {
      await triggerFinanceSync();

      // Poll sync status
      pollRef.current = setInterval(async () => {
        try {
          const status = await fetchSyncStatus();
          setSyncStep(status.step);
          setSyncProgress(status.progress);

          if (status.status === "done" || status.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (status.status === "error") {
              setError(`Sync failed: ${status.step}`);
            }
            setSyncing(false);
            await loadDashboard();
          }
        } catch {
          // ignore poll errors
        }
      }, 1500);

      // Safety timeout — stop polling after 60s
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setSyncing(false);
          loadDashboard();
        }
      }, 60000);
    } catch {
      setError("Failed to trigger sync.");
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData =
    data &&
    (data.treasury_accounts.length > 0 || data.monthly_summary.length > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-full bg-muted p-4">
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">No financial data yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your Holded account in Settings to sync bank movements.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/settings">Go to Settings</Link>
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
        {syncing && (
          <div className="w-64 space-y-1.5">
            <Progress value={syncProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{syncStep}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Financial Overview
          </h1>
          {data.last_synced && (
            <p className="text-sm text-muted-foreground">
              Last synced:{" "}
              {new Date(data.last_synced).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* Sync progress */}
      {syncing && (
        <div className="space-y-1.5">
          <Progress value={syncProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{syncStep}</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* KPI Cards */}
      <KpiCards kpis={data.kpis} forecast={data.forecast} />

      {/* P&L Chart */}
      {data.monthly_summary.length > 0 && (
        <PlChart data={data.monthly_summary} />
      )}

      {/* Forecast Settings */}
      <ForecastSettingsPanel
        initial={data.forecast}
        onUpdate={() => loadDashboard()}
      />

      {/* Expense / Income breakdown */}
      <ExpenseBreakdown
        expenses={data.expense_breakdown}
        income={data.income_sources}
      />

      {/* Category Manager + Planned Expenses */}
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryManager onUpdate={() => loadDashboard()} />
        <PlannedExpensesPanel />
      </div>

      {/* Treasury Accounts */}
      <TreasuryAccounts accounts={data.treasury_accounts} />
    </div>
  );
}
