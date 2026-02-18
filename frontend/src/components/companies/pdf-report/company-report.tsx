import { Document } from "@react-pdf/renderer";
import type { CompanyDetail, SuggestionsData } from "@/types";
import { CoverPage } from "./sections/cover-page";
import { MarketIntelligence } from "./sections/market-intelligence";
import { DigestSection } from "./sections/digest-section";
import { CEOBriefing } from "./sections/ceo-briefing";

export function CompanyReport({
  company,
  suggestions,
}: {
  company: CompanyDetail;
  suggestions: SuggestionsData | null;
}) {
  return (
    <Document
      title={`${company.name} - Intelligence Report`}
      author="founderOS"
    >
      <CoverPage company={company} />
      {suggestions && (
        <CEOBriefing company={company} suggestions={suggestions} />
      )}
      <MarketIntelligence company={company} />
      <DigestSection company={company} />
    </Document>
  );
}
