import { apiFetch } from "@/lib/api";
import type {
  CategoryRule,
  FinanceDashboard,
  ForecastSettings,
  HoldedConnectionTest,
  PlannedExpense,
  SyncStatus,
} from "@/types";

export async function fetchFinanceDashboard(): Promise<FinanceDashboard> {
  return apiFetch<FinanceDashboard>("/finance/dashboard");
}

export async function triggerFinanceSync(): Promise<void> {
  await apiFetch("/finance/sync", { method: "POST" });
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  return apiFetch<SyncStatus>("/finance/sync-status");
}

export async function testHoldedConnection(): Promise<HoldedConnectionTest> {
  return apiFetch<HoldedConnectionTest>("/finance/test-connection", {
    method: "POST",
  });
}

export async function fetchForecast(): Promise<ForecastSettings> {
  return apiFetch<ForecastSettings>("/finance/forecast");
}

export async function updateForecast(
  data: ForecastSettings
): Promise<ForecastSettings> {
  return apiFetch<ForecastSettings>("/finance/forecast", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Categories ──────────────────────────────────────────────

export async function fetchCategoryRules(): Promise<CategoryRule[]> {
  return apiFetch<CategoryRule[]>("/finance/categories");
}

export async function fetchCategoryOptions(): Promise<string[]> {
  return apiFetch<string[]>("/finance/categories/options");
}

export async function upsertCategoryRule(
  contact_name: string,
  category: string
): Promise<CategoryRule> {
  return apiFetch<CategoryRule>("/finance/categories", {
    method: "PUT",
    body: JSON.stringify({ contact_name, category }),
  });
}

export async function triggerAutoClassify(): Promise<void> {
  await apiFetch("/finance/categories/auto-classify", { method: "POST" });
}

export async function deleteCategoryRule(ruleId: string): Promise<void> {
  await apiFetch(`/finance/categories/${ruleId}`, { method: "DELETE" });
}

// ── Planned expenses ────────────────────────────────────────

export async function fetchPlannedExpenses(): Promise<PlannedExpense[]> {
  return apiFetch<PlannedExpense[]>("/finance/planned-expenses");
}

export async function createPlannedExpense(
  data: Omit<PlannedExpense, "id">
): Promise<PlannedExpense> {
  return apiFetch<PlannedExpense>("/finance/planned-expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlannedExpense(
  id: string,
  data: Partial<PlannedExpense>
): Promise<PlannedExpense> {
  return apiFetch<PlannedExpense>(`/finance/planned-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePlannedExpense(id: string): Promise<void> {
  await apiFetch(`/finance/planned-expenses/${id}`, { method: "DELETE" });
}
