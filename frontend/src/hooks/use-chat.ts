"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, Conversation } from "@/types";
import {
  fetchConversations,
  createConversation,
  fetchConversation,
  sendConversationMessage,
  deleteConversation,
} from "@/lib/api/conversations";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const initialized = useRef(false);

  // Load conversations on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const convs = await fetchConversations();
      setConversations(convs);
    } catch {
      // ignore
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    try {
      const conv = await fetchConversation(id);
      setMessages(conv.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch {
        // ignore
      }
    },
    [activeConversationId]
  );

  const sendMessage = useCallback(
    async (question: string, companyId?: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        let convId = activeConversationId;

        // Create conversation if none active
        if (!convId) {
          const conv = await createConversation(undefined, companyId);
          convId = conv.id;
          setActiveConversationId(convId);
          setConversations((prev) => [conv, ...prev]);
        }

        // Send message via persistent conversation endpoint
        const response = await sendConversationMessage(
          convId,
          question,
          companyId
        );

        const assistantMessage: ChatMessage = {
          id: response.id || crypto.randomUUID(),
          role: "assistant",
          content: response.content,
          sources: response.sources,
          timestamp: response.timestamp || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation title in list (auto-title from first message)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  title:
                    c.title === "New Conversation"
                      ? question.slice(0, 60) + (question.length > 60 ? "..." : "")
                      : c.title,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your question. Please try again.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId]
  );

  return {
    messages,
    sendMessage,
    isLoading,
    conversations,
    conversationsLoading,
    activeConversationId,
    selectConversation,
    startNewConversation,
    deleteConversation: handleDeleteConversation,
  };
}
