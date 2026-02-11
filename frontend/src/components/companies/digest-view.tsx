"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RefreshCw, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rerunEnrichment } from "@/lib/api/companies";
import type { CompanyDigest } from "@/types";

interface DigestViewProps {
  companyId: string;
  digests: CompanyDigest[];
  onRegenerated: () => void;
}

export function DigestView({
  companyId,
  digests,
  onRegenerated,
}: DigestViewProps) {
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await rerunEnrichment(companyId);
      // Start polling or inform user
      setTimeout(() => {
        onRegenerated();
        setRegenerating(false);
      }, 2000);
    } catch {
      setRegenerating(false);
    }
  };

  // Group digests by type, show latest of each
  const digestByType: Record<string, CompanyDigest> = {};
  for (const d of digests) {
    if (
      !digestByType[d.digest_type] ||
      (d.generated_at &&
        d.generated_at > (digestByType[d.digest_type].generated_at || ""))
    ) {
      digestByType[d.digest_type] = d;
    }
  }

  const typeLabels: Record<string, string> = {
    full: "Full Digest",
    social: "Social Media Digest",
    comparison: "Comparison Digest",
    potential_clients: "Potential Clients",
    crosscheck: "360° Crosscheck",
  };

  const typeColors: Record<string, string> = {
    full: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    social: "bg-blue-500/10 text-blue-700 border-blue-200",
    comparison: "bg-purple-500/10 text-purple-700 border-purple-200",
    potential_clients: "bg-amber-500/10 text-amber-700 border-amber-200",
    crosscheck: "bg-red-500/10 text-red-700 border-red-200",
  };

  if (Object.keys(digestByType).length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            No digests generated yet.
          </p>
          <Button onClick={handleRegenerate} disabled={regenerating} size="sm">
            {regenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generate Digest
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleRegenerate}
          disabled={regenerating}
          variant="outline"
          size="sm"
        >
          {regenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Regenerate
        </Button>
      </div>

      {Object.entries(digestByType).map(([type, digest]) => (
        <Card key={type}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={typeColors[type] || ""}
                >
                  {typeLabels[type] || type}
                </Badge>
              </CardTitle>
              {digest.generated_at && (
                <span className="text-xs text-muted-foreground">
                  {new Date(digest.generated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {digest.digest_markdown}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
