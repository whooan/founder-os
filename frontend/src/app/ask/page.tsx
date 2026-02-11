"use client";

import { ChatInterface } from "@/components/ask/chat-interface";
import { useChat } from "@/hooks/use-chat";

export default function AskPage() {
  const { messages, sendMessage, isLoading } = useChat();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Ask Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Ask questions about your tracked companies and get AI-powered insights
        </p>
      </div>

      <div className="flex-1 rounded-lg border bg-card overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
