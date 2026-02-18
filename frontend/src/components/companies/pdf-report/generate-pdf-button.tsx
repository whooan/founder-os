"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSuggestions } from "@/lib/api/suggestions";
import type { CompanyDetail, SuggestionsData } from "@/types";

export function GeneratePdfButton({ company }: { company: CompanyDetail }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Fetch suggestions in parallel with dynamic imports
      const [{ pdf }, { CompanyReport }, suggestionsResult] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./company-report"),
        fetchSuggestions(company.id).catch(() => null),
      ]);

      const suggestions: SuggestionsData | null =
        suggestionsResult && "potential_customers" in suggestionsResult
          ? (suggestionsResult as SuggestionsData)
          : null;

      const blob = await pdf(
        <CompanyReport company={company} suggestions={suggestions} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${company.name.replace(/[^a-zA-Z0-9]/g, "_")}_Intelligence_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={generating}
    >
      {generating ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-3.5 w-3.5" />
      )}
      Export PDF
    </Button>
  );
}
