import { Page, Text, View } from "@react-pdf/renderer";
import type { CompanyDetail } from "@/types";
import { styles } from "../pdf-styles";
import { MarkdownContent } from "../markdown-renderer";

const typeLabels: Record<string, string> = {
  full: "Full Digest",
  social: "Social Media Digest",
  comparison: "Comparison Digest",
  potential_clients: "Potential Clients",
  crosscheck: "360\u00B0 Crosscheck",
};

export function DigestSection({ company }: { company: CompanyDetail }) {
  if (!company.digests || company.digests.length === 0) return null;

  // Group by type, keep latest of each
  const digestByType: Record<string, (typeof company.digests)[0]> = {};
  for (const d of company.digests) {
    if (
      !digestByType[d.digest_type] ||
      (d.generated_at &&
        d.generated_at > (digestByType[d.digest_type].generated_at || ""))
    ) {
      digestByType[d.digest_type] = d;
    }
  }

  const entries = Object.entries(digestByType);
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map(([type, digest]) => (
        <Page key={type} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>
            {typeLabels[type] || type}
          </Text>
          {digest.generated_at && (
            <Text style={{ fontSize: 8, color: "#94a3b8", marginBottom: 12 }}>
              Generated{" "}
              {new Date(digest.generated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
          <MarkdownContent content={digest.digest_markdown} />
          <View style={styles.footer}>
            <Text>founderOS Intelligence Report</Text>
            <Text>{company.name}</Text>
          </View>
        </Page>
      ))}
    </>
  );
}
