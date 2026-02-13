import { apiFetch } from "@/lib/api";
import type { SuggestionsData } from "@/types";

export async function fetchSuggestions(
  companyId: string
): Promise<SuggestionsData | { status: string }> {
  return apiFetch(`/suggestions/${companyId}`);
}

export async function generateSuggestions(
  companyId: string
): Promise<{ status: string; message: string }> {
  return apiFetch(`/suggestions/${companyId}/generate`, { method: "POST" });
}
