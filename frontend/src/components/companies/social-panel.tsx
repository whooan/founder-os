"use client";

import { useState } from "react";
import { Linkedin, Twitter, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SocialPostCard } from "./social-post-card";
import type { SocialPost } from "@/types";

const PLATFORMS = [
  { key: "all", label: "All", icon: null },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "X / Twitter", icon: Twitter },
  { key: "hackernews", label: "Hacker News", icon: MessageSquare },
] as const;

interface SocialPanelProps {
  posts: SocialPost[];
  socialHandles: Record<string, string> | null;
  onDeleted?: () => void;
}

export function SocialPanel({ posts, socialHandles, onDeleted }: SocialPanelProps) {
  const [activePlatform, setActivePlatform] = useState<string>("all");

  const filteredPosts =
    activePlatform === "all"
      ? posts
      : posts.filter((p) => p.platform === activePlatform);

  const platformCounts: Record<string, number> = {};
  for (const p of posts) {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Social handles */}
      {socialHandles && Object.keys(socialHandles).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(socialHandles).map(([platform, handle]) => {
            const config = PLATFORMS.find((p) => p.key === platform);
            const Icon = config?.icon;
            const url =
              platform === "linkedin"
                ? `https://linkedin.com/company/${handle}`
                : platform === "twitter"
                ? `https://x.com/${handle}`
                : null;

            return (
              <a
                key={platform}
                href={url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-accent transition-colors"
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span className="font-medium">@{handle}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Platform filter tabs */}
      <div className="flex gap-1.5 border-b pb-2">
        {PLATFORMS.map(({ key, label }) => {
          const count =
            key === "all"
              ? posts.length
              : platformCounts[key] || 0;
          if (key !== "all" && count === 0) return null;

          return (
            <button
              key={key}
              onClick={() => setActivePlatform(key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activePlatform === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {label}
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No social media posts found.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => (
            <SocialPostCard key={post.id} post={post} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
