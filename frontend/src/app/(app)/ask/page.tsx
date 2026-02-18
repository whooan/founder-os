"use client";

import { ChatInterface } from "@/components/ask/chat-interface";
import { ConversationList } from "@/components/ask/conversation-list";
import { useChat } from "@/hooks/use-chat";

export default function AskPage() {
  const {
    messages,
    sendMessage,
    isLoading,
    conversations,
    conversationsLoading,
    activeConversationId,
    selectConversation,
    startNewConversation,
    deleteConversation,
  } = useChat();

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Conversation sidebar */}
      <div className="w-64 border-r bg-card shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={selectConversation}
          onNew={startNewConversation}
          onDelete={deleteConversation}
          loading={conversationsLoading}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Ask Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your tracked companies and get AI-powered insights
          </p>
        </div>

        <div className="flex-1 rounded-lg border bg-card mx-4 mb-4 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
