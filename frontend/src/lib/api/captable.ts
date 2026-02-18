import { apiFetch } from "@/lib/api";
import type {
  ShareClass,
  Stakeholder,
  EquityEvent,
  CapTableSnapshot,
  CapTableEvolutionEntry,
  CapTableKPIs,
} from "@/types";

// ── Share Classes ────────────────────────────────────────────

export async function fetchShareClasses(
  companyId: string
): Promise<ShareClass[]> {
  return apiFetch<ShareClass[]>(`/captable/${companyId}/share-classes`);
}

export async function createShareClass(
  companyId: string,
  data: { name: string; votes_per_share?: number; liquidation_preference?: string; seniority?: number }
): Promise<ShareClass> {
  return apiFetch<ShareClass>(`/captable/${companyId}/share-classes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteShareClass(id: string): Promise<void> {
  await apiFetch<void>(`/captable/share-classes/${id}`, { method: "DELETE" });
}

// ── Stakeholders ─────────────────────────────────────────────

export async function fetchStakeholders(
  companyId: string
): Promise<Stakeholder[]> {
  return apiFetch<Stakeholder[]>(`/captable/${companyId}/stakeholders`);
}

export async function createStakeholder(
  companyId: string,
  data: {
    name: string;
    type: string;
    email?: string;
    phone?: string;
    entity_name?: string;
    contact_person?: string;
    partner_emails?: string;
    linkedin_url?: string;
    notes?: string;
  }
): Promise<Stakeholder> {
  return apiFetch<Stakeholder>(`/captable/${companyId}/stakeholders`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStakeholder(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    email: string;
    phone: string;
    entity_name: string;
    contact_person: string;
    partner_emails: string;
    linkedin_url: string;
    notes: string;
  }>
): Promise<Stakeholder> {
  return apiFetch<Stakeholder>(`/captable/stakeholders/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteStakeholder(id: string): Promise<void> {
  await apiFetch<void>(`/captable/stakeholders/${id}`, { method: "DELETE" });
}

// ── Equity Events ────────────────────────────────────────────

export async function fetchEquityEvents(
  companyId: string
): Promise<EquityEvent[]> {
  return apiFetch<EquityEvent[]>(`/captable/${companyId}/events`);
}

export async function createEquityEvent(
  companyId: string,
  data: {
    name: string;
    event_type: string;
    date?: string;
    pre_money_valuation?: number;
    amount_raised?: number;
    price_per_share?: number;
    total_shares_after?: number;
    notes?: string;
    allocations: {
      stakeholder_id: string;
      share_class_id: string;
      shares: number;
      amount_invested?: number;
      ownership_pct?: number;
    }[];
  }
): Promise<EquityEvent> {
  return apiFetch<EquityEvent>(`/captable/${companyId}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteEquityEvent(id: string): Promise<void> {
  await apiFetch<void>(`/captable/events/${id}`, { method: "DELETE" });
}

// ── Cap Table Views ──────────────────────────────────────────

export async function fetchCapTableKPIs(
  companyId: string
): Promise<CapTableKPIs> {
  return apiFetch<CapTableKPIs>(`/captable/${companyId}/kpis`);
}

export async function fetchCapTableSnapshot(
  companyId: string
): Promise<CapTableSnapshot> {
  return apiFetch<CapTableSnapshot>(`/captable/${companyId}/snapshot`);
}

export async function fetchCapTableEvolution(
  companyId: string
): Promise<CapTableEvolutionEntry[]> {
  return apiFetch<CapTableEvolutionEntry[]>(
    `/captable/${companyId}/evolution`
  );
}
