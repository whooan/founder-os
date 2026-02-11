import { apiFetch } from "@/lib/api";
import type { Company, CompanyDetail } from "@/types";

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

export async function fetchCompanyStatus(
  id: string
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/companies/${id}/status`);
}
