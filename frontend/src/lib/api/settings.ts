import { apiFetch } from "@/lib/api";

interface SettingsResponse {
  openai_api_key_masked: string;
  openai_model: string;
  is_configured: boolean;
}

interface SettingsUpdate {
  openai_api_key?: string;
  openai_model?: string;
}

interface SettingsStatus {
  is_configured: boolean;
}

export async function fetchSettings(): Promise<SettingsResponse> {
  return apiFetch<SettingsResponse>("/settings");
}

export async function updateSettings(
  data: SettingsUpdate
): Promise<SettingsResponse> {
  return apiFetch<SettingsResponse>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchSettingsStatus(): Promise<SettingsStatus> {
  return apiFetch<SettingsStatus>("/settings/status");
}
