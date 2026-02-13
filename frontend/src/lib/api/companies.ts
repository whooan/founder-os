import { apiFetch } from "@/lib/api";
import type {
  Company,
  CompanyDetail,
  ComparisonData,
  CompetitorClient,
  SocialPost,
  CompanyDigest,
  EnrichmentSnapshot,
  ConsolidatedComparisonData,
  QuadrantData,
} from "@/types";

export async function fetchCompanies(): Promise<Company[]> {
  return apiFetch<Company[]>("/companies");
}

export async function fetchCompany(id: string): Promise<CompanyDetail> {
  return apiFetch<CompanyDetail>(`/companies/${id}`);
}

export async function createCompany(name: string): Promise<Company> {
  return apiFetch<Company>("/companies", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCompany(id: string): Promise<void> {
  await apiFetch<void>(`/companies/${id}`, { method: "DELETE" });
}

export async function updateCompany(
  id: string,
  data: Partial<{
    name: string;
    domain: string;
    description: string;
    one_liner: string;
    stage: string;
    hq_location: string;
    employee_range: string;
    founded_year: number;
    social_handles: Record<string, string>;
  }>
): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function setPrimaryCompany(id: string): Promise<Company> {
  return apiFetch<Company>(`/companies/${id}/primary`, { method: "PATCH" });
}

export async function addCustomSource(
  companyId: string,
  url: string,
  title?: string
): Promise<{ id: string; url: string; title: string }> {
  return apiFetch(`/companies/${companyId}/sources`, {
    method: "POST",
    body: JSON.stringify({ url, title }),
  });
}

export async function deleteSource(
  companyId: string,
  sourceId: string
): Promise<void> {
  await apiFetch<void>(`/companies/${companyId}/sources/${sourceId}`, {
    method: "DELETE",
  });
}

export async function deleteSocialPost(
  companyId: string,
  postId: string
): Promise<void> {
  await apiFetch<void>(`/companies/${companyId}/social/${postId}`, {
    method: "DELETE",
  });
}

export async function rerunEnrichment(
  companyId: string
): Promise<{ status: string }> {
  return apiFetch(`/companies/${companyId}/rerun`, { method: "POST" });
}

export async function incrementalUpdate(
  companyId: string
): Promise<{ status: string }> {
  return apiFetch(`/companies/${companyId}/update`, { method: "POST" });
}

export async function reanalyzeCompany(
  companyId: string
): Promise<{ status: string; message: string }> {
  return apiFetch(`/companies/${companyId}/reanalyze`, { method: "POST" });
}

export async function fetchSocialPosts(
  companyId: string,
  platform?: string
): Promise<SocialPost[]> {
  const params = platform ? `?platform=${platform}` : "";
  return apiFetch<SocialPost[]>(`/companies/${companyId}/social${params}`);
}

export async function fetchCompanyDigests(
  companyId: string
): Promise<CompanyDigest[]> {
  return apiFetch<CompanyDigest[]>(`/companies/${companyId}/digest`);
}

export async function fetchComparisonData(
  ids: string[]
): Promise<ComparisonData> {
  return apiFetch<ComparisonData>(`/companies/compare?ids=${ids.join(",")}`);
}

export async function compareChat(
  companyIds: string[],
  question: string
): Promise<{ answer: string; sources: { label: string; url: string }[] }> {
  return apiFetch("/companies/compare/chat", {
    method: "POST",
    body: JSON.stringify({ company_ids: companyIds, question }),
  });
}

export async function updateFounder(
  founderId: string,
  data: Partial<{
    name: string;
    title: string;
    linkedin_url: string;
    twitter_handle: string;
    bio: string;
  }>
): Promise<{ id: string; name: string }> {
  return apiFetch(`/founders/${founderId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchCompanyStatus(
  id: string
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/companies/${id}/status`);
}

export async function fetchCompetitorClients(
  companyId: string
): Promise<CompetitorClient[]> {
  return apiFetch<CompetitorClient[]>(
    `/companies/${companyId}/competitor-clients`
  );
}

export async function findPotentialClients(
  companyId: string
): Promise<{ status: string; message: string }> {
  return apiFetch(`/companies/${companyId}/find-potential-clients`, {
    method: "POST",
  });
}

// ── Versioning ──────────────────────────────────────────────

export async function bulkUpdate(): Promise<{
  status: string;
  count: number;
}> {
  return apiFetch("/companies/bulk-update", { method: "POST" });
}

export async function fetchSnapshots(
  companyId: string
): Promise<EnrichmentSnapshot[]> {
  return apiFetch<EnrichmentSnapshot[]>(
    `/companies/${companyId}/snapshots`
  );
}

// ── Consolidated Feature Comparison ─────────────────────────

export async function fetchConsolidatedComparison(
  ids: string[]
): Promise<ConsolidatedComparisonData> {
  return apiFetch<ConsolidatedComparisonData>(
    `/companies/compare/consolidated?ids=${ids.join(",")}`
  );
}

// ── Quadrant Visualization ──────────────────────────────────

export async function fetchQuadrantData(
  ids: string[]
): Promise<QuadrantData> {
  return apiFetch<QuadrantData>(
    `/companies/compare/quadrant?ids=${ids.join(",")}`
  );
}
