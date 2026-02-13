import { apiFetch } from "@/lib/api";

export interface SettingsResponse {
  founder_name: string;
  org_name: string;
  openai_api_key_masked: string;
  openai_model: string;
  is_configured: boolean;
  auto_update_enabled: boolean;
  auto_update_hour: number;
  last_daily_update: string | null;
}

export interface SettingsUpdate {
  founder_name?: string;
  org_name?: string;
  openai_api_key?: string;
  openai_model?: string;
  auto_update_enabled?: boolean;
  auto_update_hour?: number;
}

interface SettingsStatus {
  is_configured: boolean;
}

export interface ProfileResponse {
  founder_name: string;
  org_name: string;
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

export async function fetchProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/settings/profile");
}

export async function triggerUpdateNow(): Promise<void> {
  await apiFetch("/settings/update-now", { method: "POST" });
}
