import { apiFetch } from "@/lib/api";
import type { AskResponse } from "@/types";

export async function askIntelligence(
  question: string,
  companyId?: string
): Promise<AskResponse> {
  return apiFetch<AskResponse>("/ask", {
    method: "POST",
    body: JSON.stringify({ question, company_id: companyId }),
  });
}
