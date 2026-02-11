"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, MessageSquare, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compareChat } from "@/lib/api/companies";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { label: string; url: string }[];
}

interface ComparisonChatProps {
  companyIds: string[];
  panelMode?: boolean;
  onClose?: () => void;
}

export function ComparisonChat({
  companyIds,
  panelMode = false,
  onClose,
}: ComparisonChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const result = await compareChat(companyIds, question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What are the key differences between these companies?",
    "Which company has the strongest competitive position?",
    "Compare their funding strategies and investor quality",
    "What features does my company lack vs competitors?",
  ];

  const messagesContent = (
    <>
      {messages.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Ask questions about the selected companies. All data (sources,
            social, events, digests) is included in context.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="text-xs rounded-full border px-3 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`rounded-lg p-3 ${
            msg.role === "user"
              ? "bg-primary/5 ml-8"
              : "bg-muted/50 mr-8"
          }`}
        >
          <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">
            {msg.role === "user" ? "You" : "AI Analysis"}
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                Sources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {msg.sources.map((src, j) => (
                  <a
                    key={j}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {src.label}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing with full context...
        </div>
      )}
    </>
  );

  const inputArea = (
    <div className="flex gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ask about these companies..."
        disabled={loading || companyIds.length === 0}
      />
      <Button
        onClick={handleSend}
        disabled={loading || !input.trim() || companyIds.length === 0}
        size="icon"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  // Panel mode: render as a flex column without Card wrapper
  if (panelMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Intelligence Chat</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesContent}
        </div>
        <div className="p-4 pt-2 border-t shrink-0">
          {inputArea}
        </div>
      </div>
    );
  }

  // Default: Card-wrapped mode
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Competitive Intelligence Chat
          <span className="text-xs font-normal text-muted-foreground">
            Powered by GPT-4.1 (1M context)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 mb-3"
        >
          {messagesContent}
        </div>
        {inputArea}
      </CardContent>
    </Card>
  );
}
