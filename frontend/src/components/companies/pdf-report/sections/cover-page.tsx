import { Page, Text, View } from "@react-pdf/renderer";
import type { CompanyDetail } from "@/types";
import { styles } from "../pdf-styles";

export function CoverPage({ company }: { company: CompanyDetail }) {
  return (
    <Page size="A4" style={[styles.page, styles.coverPage]}>
      <Text style={styles.coverBrand}>founderOS Intelligence Report</Text>
      <View style={styles.coverDivider} />
      <Text style={styles.coverCompany}>{company.name}</Text>
      {company.one_liner && (
        <Text style={styles.coverOneLiner}>{company.one_liner}</Text>
      )}
      <View style={styles.coverMeta}>
        {company.stage && (
          <Text style={styles.coverMetaItem}>{company.stage}</Text>
        )}
        {company.hq_location && (
          <Text style={styles.coverMetaItem}>{company.hq_location}</Text>
        )}
        {company.domain && (
          <Text style={styles.coverMetaItem}>{company.domain}</Text>
        )}
        {company.employee_range && (
          <Text style={styles.coverMetaItem}>
            {company.employee_range} employees
          </Text>
        )}
      </View>
      <Text style={styles.coverDate}>
        Generated {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>
      <View style={styles.footer}>
        <Text>founderOS Intelligence Report</Text>
        <Text>{company.name}</Text>
      </View>
    </Page>
  );
}
