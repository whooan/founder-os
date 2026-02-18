import { apiFetch } from "@/lib/api";
import type { LegalDocument, CompanyLegal } from "@/types";

// ── Legal Documents ──────────────────────────────────────────

export async function fetchLegalDocuments(
  companyId: string
): Promise<LegalDocument[]> {
  return apiFetch<LegalDocument[]>(`/legal/${companyId}/documents`);
}

export async function createLegalDocument(
  companyId: string,
  data: {
    title: string;
    doc_type: string;
    date?: string;
    summary?: string;
    file_url?: string;
    file_name?: string;
    notes?: string;
  }
): Promise<LegalDocument> {
  return apiFetch<LegalDocument>(`/legal/${companyId}/documents`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLegalDocument(
  id: string,
  data: Partial<{
    title: string;
    doc_type: string;
    date: string;
    summary: string;
    file_url: string;
    file_name: string;
    notes: string;
  }>
): Promise<LegalDocument> {
  return apiFetch<LegalDocument>(`/legal/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLegalDocument(id: string): Promise<void> {
  await apiFetch<void>(`/legal/documents/${id}`, { method: "DELETE" });
}

// ── Company Legal Info ───────────────────────────────────────

export async function fetchCompanyLegal(
  companyId: string
): Promise<CompanyLegal | null> {
  return apiFetch<CompanyLegal | null>(`/legal/${companyId}/company-info`);
}

export async function upsertCompanyLegal(
  companyId: string,
  data: Partial<{
    legal_name: string;
    cif: string;
    registered_address: string;
    city: string;
    postal_code: string;
    country: string;
    registration_number: string;
    registration_date: string;
    notary: string;
    protocol_number: string;
    notes: string;
  }>
): Promise<CompanyLegal> {
  return apiFetch<CompanyLegal>(`/legal/${companyId}/company-info`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
