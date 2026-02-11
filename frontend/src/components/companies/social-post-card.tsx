"use client";

import { useState } from "react";
import {
  ExternalLink,
  Linkedin,
  Twitter,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteSocialPost } from "@/lib/api/companies";
import type { SocialPost } from "@/types";

const PLATFORM_CONFIG: Record<
  string,
  { icon: typeof Linkedin; label: string; color: string }
> = {
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  twitter: {
    icon: Twitter,
    label: "X / Twitter",
    color: "bg-sky-500/10 text-sky-600 border-sky-200",
  },
  hackernews: {
    icon: MessageSquare,
    label: "Hacker News",
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
};

interface SocialPostCardProps {
  post: SocialPost;
  onDeleted?: () => void;
}

export function SocialPostCard({ post, onDeleted }: SocialPostCardProps) {
  const [deleting, setDeleting] = useState(false);

  const config = PLATFORM_CONFIG[post.platform] || {
    icon: MessageSquare,
    label: post.platform,
    color: "bg-muted text-muted-foreground",
  };
  const Icon = config.icon;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSocialPost(post.company_id, post.id);
      onDeleted?.();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors group">
      <div
        className={`rounded-full p-1.5 shrink-0 ${config.color}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {config.label}
          </Badge>
          {post.author && (
            <span className="text-xs text-muted-foreground">
              {post.author}
            </span>
          )}
          {post.posted_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(post.posted_at).toLocaleDateString()}
            </span>
          )}
        </div>
        {post.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.content}
          </p>
        )}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            View source
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            title="Delete post"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete social post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this {config.label} post from the tracked
              activity. You can click &quot;Update Intel&quot; afterwards to
              regenerate the analysis without this post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
