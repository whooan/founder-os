"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { deleteSource } from "@/lib/api/companies";
import type { DataSource } from "@/types";

interface SourceCardProps {
  source: DataSource;
  onDeleted?: () => void;
}

export function SourceCard({ source, onDeleted }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayTitle = source.title || new URL(source.url).hostname;
  const hasContent = !!(source.raw_content_md || source.raw_content || source.content_snippet);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSource(source.company_id, source.id);
      onDeleted?.();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            onClick={() => hasContent && setExpanded(!expanded)}
            className="p-0.5 mt-0.5 rounded hover:bg-accent transition-colors shrink-0"
            disabled={!hasContent}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium truncate hover:underline"
              >
                {displayTitle}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground truncate">
                {source.url}
              </span>
              <Badge
                variant={source.is_custom ? "default" : "secondary"}
                className="text-[10px] shrink-0 px-1.5 py-0"
              >
                {source.is_custom ? (
                  <>
                    <UserPlus className="mr-1 h-2.5 w-2.5" />
                    Custom
                  </>
                ) : (
                  "Auto"
                )}
              </Badge>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Delete source"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete source?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &quot;{displayTitle}&quot; from the research
                  sources. You can click &quot;Update Intel&quot; afterwards to
                  regenerate the analysis without this source.
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

        {expanded && hasContent && (
          <div className="mt-3 ml-6 rounded-md bg-muted/50 p-3 max-h-80 overflow-y-auto">
            {source.raw_content_md ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {source.raw_content_md}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-sans text-muted-foreground">
                {source.raw_content || source.content_snippet}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
