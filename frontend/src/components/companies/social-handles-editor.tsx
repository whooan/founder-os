"use client";

import { useState } from "react";
import {
  Linkedin,
  Twitter,
  MessageSquare,
  Plus,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateCompany } from "@/lib/api/companies";

const PLATFORM_CONFIG = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "company-slug or username",
    urlPrefix: "https://linkedin.com/company/",
  },
  {
    key: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    placeholder: "handle (without @)",
    urlPrefix: "https://x.com/",
  },
  {
    key: "hackernews",
    label: "Hacker News",
    icon: MessageSquare,
    placeholder: "username",
    urlPrefix: "https://news.ycombinator.com/user?id=",
  },
] as const;

interface SocialHandlesEditorProps {
  companyId: string;
  handles: Record<string, string> | null;
  onUpdated: () => void;
}

export function SocialHandlesEditor({
  companyId,
  handles,
  onUpdated,
}: SocialHandlesEditorProps) {
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const currentHandles = handles || {};

  const handleSave = async (platform: string) => {
    setSaving(true);
    try {
      const updated = { ...currentHandles };
      const trimmed = editValue.trim().replace(/^@/, "");
      if (trimmed) {
        updated[platform] = trimmed;
      } else {
        delete updated[platform];
      }
      await updateCompany(companyId, { social_handles: updated });
      setEditingPlatform(null);
      setEditValue("");
      onUpdated();
    } catch {
      // keep editing state on error
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (platform: string) => {
    setSaving(true);
    try {
      const updated = { ...currentHandles };
      delete updated[platform];
      await updateCompany(companyId, { social_handles: updated });
      onUpdated();
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Tracked Accounts</p>
      <p className="text-xs text-muted-foreground mb-3">
        Add social media accounts to track activity. These will be used when
        running analysis updates.
      </p>
      {PLATFORM_CONFIG.map(
        ({ key, label, icon: Icon, placeholder, urlPrefix }) => {
          const value = currentHandles[key];
          const isEditing = editingPlatform === key;

          return (
            <div key={key} className="flex items-center gap-2 group">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground w-24 shrink-0">
                {label}
              </span>
              {isEditing ? (
                <>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={placeholder}
                    className="h-7 text-sm flex-1"
                    disabled={saving}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(key);
                      if (e.key === "Escape") setEditingPlatform(null);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(key)}
                    disabled={saving}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingPlatform(null)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : value ? (
                <>
                  <a
                    href={`${urlPrefix}${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex-1 truncate"
                  >
                    @{value}
                  </a>
                  <button
                    onClick={() => {
                      setEditValue(value);
                      setEditingPlatform(key);
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemove(key)}
                    disabled={saving}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditValue("");
                    setEditingPlatform(key);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}
