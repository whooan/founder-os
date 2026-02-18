import { Page, Text, View } from "@react-pdf/renderer";
import type { CompanyDetail } from "@/types";
import { styles } from "../pdf-styles";
import { MarkdownContent } from "../markdown-renderer";

export function MarketIntelligence({ company }: { company: CompanyDetail }) {
  const hasPositioning = !!company.positioning_summary;
  const hasGtm = !!company.gtm_strategy;
  const hasMediaTone =
    company.media_tone && Object.keys(company.media_tone).length > 0;
  const hasTopics = company.top_topics && company.top_topics.length > 0;
  const hasDifferentiators =
    company.key_differentiators && company.key_differentiators.length > 0;
  const hasRisks = company.risk_signals && company.risk_signals.length > 0;

  if (
    !hasPositioning &&
    !hasGtm &&
    !hasMediaTone &&
    !hasTopics &&
    !hasDifferentiators &&
    !hasRisks
  )
    return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Market Intelligence</Text>

      {hasPositioning && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>Positioning Summary</Text>
          <MarkdownContent content={company.positioning_summary!} />
        </View>
      )}

      {hasGtm && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>GTM Strategy</Text>
          <MarkdownContent content={company.gtm_strategy!} />
        </View>
      )}

      {hasMediaTone && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>Media Tone</Text>
          {Object.entries(company.media_tone!).map(([key, value]) => (
            <View key={key} style={styles.kvRow}>
              <Text style={styles.kvKey}>{key.replace(/_/g, " ")}</Text>
              <Text style={styles.kvValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      {hasTopics && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>Top Topics</Text>
          <View style={styles.badgeRow}>
            {company.top_topics!.map((topic, i) => (
              <View key={i} style={styles.badge}>
                <Text style={styles.badgeText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hasDifferentiators && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>Key Differentiators</Text>
          {company.key_differentiators!.map((diff, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>{"\u2022"}</Text>
              <Text style={styles.listText}>{diff}</Text>
            </View>
          ))}
        </View>
      )}

      {hasRisks && (
        <View style={styles.mb12}>
          <Text style={styles.subsectionTitle}>Risk Signals</Text>
          {company.risk_signals!.map((risk, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={[styles.listBullet, { color: "#d97706" }]}>
                {"\u26A0"}
              </Text>
              <Text style={styles.listText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text>founderOS Intelligence Report</Text>
        <Text>{company.name}</Text>
      </View>
    </Page>
  );
}
