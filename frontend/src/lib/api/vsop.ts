import { apiFetch } from "@/lib/api";
import type { VsopPool, VsopGrant, VsopSummary } from "@/types";

// ── Pool ─────────────────────────────────────────────────────

export async function fetchVsopPool(
  companyId: string
): Promise<VsopPool | null> {
  return apiFetch<VsopPool | null>(`/vsop/${companyId}/pool`);
}

export async function upsertVsopPool(
  companyId: string,
  data: {
    name?: string;
    total_shares: number;
    share_class_id?: string;
    notes?: string;
  }
): Promise<VsopPool> {
  return apiFetch<VsopPool>(`/vsop/${companyId}/pool`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVsopPool(companyId: string): Promise<void> {
  await apiFetch<void>(`/vsop/${companyId}/pool`, { method: "DELETE" });
}

// ── Grants ───────────────────────────────────────────────────

export async function createVsopGrant(
  companyId: string,
  data: {
    stakeholder_id: string;
    shares_granted: number;
    strike_price?: number;
    grant_date?: string;
    cliff_months?: number;
    vesting_months?: number;
    notes?: string;
  }
): Promise<VsopGrant> {
  return apiFetch<VsopGrant>(`/vsop/${companyId}/grants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVsopGrant(
  grantId: string,
  data: Partial<{
    shares_granted: number;
    strike_price: number;
    grant_date: string;
    cliff_months: number;
    vesting_months: number;
    status: string;
    notes: string;
  }>
): Promise<VsopGrant> {
  return apiFetch<VsopGrant>(`/vsop/grants/${grantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVsopGrant(grantId: string): Promise<void> {
  await apiFetch<void>(`/vsop/grants/${grantId}`, { method: "DELETE" });
}

// ── Summary ──────────────────────────────────────────────────

export async function fetchVsopSummary(
  companyId: string
): Promise<VsopSummary> {
  return apiFetch<VsopSummary>(`/vsop/${companyId}/summary`);
}
