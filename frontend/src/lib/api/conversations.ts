import { apiFetch } from "@/lib/api";
import type { Conversation, ChatMessage } from "@/types";

export async function fetchConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>("/conversations");
}

export async function createConversation(
  title?: string,
  companyId?: string
): Promise<Conversation> {
  return apiFetch<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({
      title: title || "New Conversation",
      company_id: companyId || null,
    }),
  });
}

export async function fetchConversation(
  id: string
): Promise<Conversation & { messages: ChatMessage[] }> {
  return apiFetch<Conversation & { messages: ChatMessage[] }>(
    `/conversations/${id}`
  );
}

export async function sendConversationMessage(
  convId: string,
  question: string,
  companyId?: string
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/conversations/${convId}/messages`, {
    method: "POST",
    body: JSON.stringify({ question, company_id: companyId || null }),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  await apiFetch<void>(`/conversations/${id}`, { method: "DELETE" });
}
