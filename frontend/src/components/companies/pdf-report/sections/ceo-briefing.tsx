import { Page, Text, View } from "@react-pdf/renderer";
import type { CompanyDetail, SuggestionsData } from "@/types";
import { styles } from "../pdf-styles";

const CATEGORY_LABELS: Record<string, string> = {
  risk: "RISK",
  opportunity: "OPPORTUNITY",
  competitor_move: "COMPETITOR",
  market_shift: "MARKET",
};

const CATEGORY_BG: Record<string, string> = {
  risk: "#fee2e2",
  opportunity: "#dcfce7",
  competitor_move: "#fef3c7",
  market_shift: "#dbeafe",
};

const CATEGORY_FG: Record<string, string> = {
  risk: "#dc2626",
  opportunity: "#16a34a",
  competitor_move: "#d97706",
  market_shift: "#2563eb",
};

const URGENCY_BG: Record<string, string> = {
  high: "#fee2e2",
  medium: "#fef3c7",
  low: "#f1f5f9",
};

const URGENCY_FG: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#64748b",
};

const PRIORITY_BG: Record<string, string> = {
  high: "#fee2e2",
  medium: "#fef3c7",
  low: "#dcfce7",
};

const PRIORITY_FG: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a",
};

function TagBadge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4 }}>
      <Text style={{ fontSize: 7, fontWeight: 600, color: fg, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

export function CEOBriefing({
  company,
  suggestions,
}: {
  company: CompanyDetail;
  suggestions: SuggestionsData;
}) {
  return (
    <>
      {/* Summary + CEO Briefing page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>CEO Intelligence Brief</Text>

        {suggestions.summary && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.paragraph}>{suggestions.summary}</Text>
            {suggestions.analysis_date && (
              <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 4 }}>
                Generated: {new Date(suggestions.analysis_date).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {suggestions.ceo_briefing.length > 0 && (
          <View>
            <Text style={styles.subsectionTitle}>Key Intelligence Items</Text>
            {suggestions.ceo_briefing.map((item, i) => (
              <View
                key={i}
                style={{
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row", marginBottom: 6 }}>
                  <TagBadge
                    label={CATEGORY_LABELS[item.category] || item.category}
                    bg={CATEGORY_BG[item.category] || "#f1f5f9"}
                    fg={CATEGORY_FG[item.category] || "#64748b"}
                  />
                  <TagBadge
                    label={item.urgency}
                    bg={URGENCY_BG[item.urgency] || "#f1f5f9"}
                    fg={URGENCY_FG[item.urgency] || "#64748b"}
                  />
                </View>
                <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>
                  {item.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text>founderOS Intelligence Report</Text>
          <Text>{company.name}</Text>
        </View>
      </Page>

      {/* Potential Customers page */}
      {suggestions.potential_customers.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Potential Customers</Text>
          <Text style={{ fontSize: 9, color: "#94a3b8", marginBottom: 14 }}>
            Companies that match your ICP based on competitor client analysis
          </Text>

          {suggestions.potential_customers.map((client, i) => (
            <View
              key={i}
              style={{
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 6,
                padding: 10,
                marginBottom: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: 600, color: "#0f172a" }}>
                  {client.company_name}
                </Text>
                <TagBadge
                  label={client.confidence}
                  bg={client.confidence === "high" ? "#dcfce7" : client.confidence === "medium" ? "#fef3c7" : "#f1f5f9"}
                  fg={client.confidence === "high" ? "#16a34a" : client.confidence === "medium" ? "#d97706" : "#64748b"}
                />
              </View>
              <View style={{ flexDirection: "row", marginBottom: 4 }}>
                {client.country ? (
                  <Text style={{ fontSize: 8, color: "#94a3b8", marginRight: 10 }}>
                    {client.country}
                  </Text>
                ) : null}
                {client.industry ? (
                  <Text style={{ fontSize: 8, color: "#94a3b8" }}>
                    {client.industry}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>
                {client.why_good_fit}
              </Text>
              {client.source_competitor_client ? (
                <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 3 }}>
                  Source: {client.source_competitor_client}
                </Text>
              ) : null}
            </View>
          ))}

          <View style={styles.footer}>
            <Text>founderOS Intelligence Report</Text>
            <Text>{company.name}</Text>
          </View>
        </Page>
      )}

      {/* Product Direction page */}
      {suggestions.product_suggestions.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Product Direction</Text>
          <Text style={{ fontSize: 9, color: "#94a3b8", marginBottom: 14 }}>
            Feature and product improvements based on competitive gaps and market trends
          </Text>

          {suggestions.product_suggestions.map((sug, i) => (
            <View
              key={i}
              style={{
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: 600, color: "#0f172a", flex: 1, marginRight: 8 }}>
                  {sug.suggestion}
                </Text>
                <TagBadge
                  label={sug.priority}
                  bg={PRIORITY_BG[sug.priority] || "#f1f5f9"}
                  fg={PRIORITY_FG[sug.priority] || "#64748b"}
                />
              </View>
              <Text style={{ fontSize: 9, color: "#475569", lineHeight: 1.5 }}>
                {sug.rationale}
              </Text>
              {sug.source_evidence ? (
                <Text style={{ fontSize: 7, color: "#94a3b8", marginTop: 4 }}>
                  Evidence: {sug.source_evidence}
                </Text>
              ) : null}
            </View>
          ))}

          <View style={styles.footer}>
            <Text>founderOS Intelligence Report</Text>
            <Text>{company.name}</Text>
          </View>
        </Page>
      )}
    </>
  );
}
