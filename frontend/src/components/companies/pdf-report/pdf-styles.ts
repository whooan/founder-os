import { StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf",
      fontWeight: 700,
    },
  ],
});

const colors = {
  primary: "#0f172a",
  secondary: "#475569",
  muted: "#94a3b8",
  accent: "#2563eb",
  border: "#e2e8f0",
  background: "#f8fafc",
  white: "#ffffff",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
  purple: "#7c3aed",
  blue: "#2563eb",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.primary,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: colors.muted,
  },

  // Cover page
  coverPage: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  coverBrand: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: 30,
    textTransform: "uppercase",
  },
  coverCompany: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  coverOneLiner: {
    fontSize: 13,
    color: colors.secondary,
    textAlign: "center",
    maxWidth: 400,
    marginBottom: 40,
  },
  coverMeta: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  coverMetaItem: {
    fontSize: 9,
    color: colors.muted,
  },
  coverDate: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 30,
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: colors.accent,
    marginBottom: 30,
  },

  // Section headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 8,
    marginTop: 14,
  },
  label: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.secondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Text
  paragraph: {
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 600,
  },
  italic: {
    fontStyle: "italic",
  },

  // Lists
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 4,
  },
  listBullet: {
    width: 14,
    fontSize: 10,
    color: colors.accent,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.5,
  },

  // Tables
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: colors.primary,
  },
  tableCellMuted: {
    fontSize: 9,
    color: colors.muted,
  },

  // Badges
  badge: {
    backgroundColor: colors.background,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 8,
    color: colors.secondary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },

  // Cards
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 8,
  },

  // Key-value rows
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  kvKey: {
    fontSize: 9,
    color: colors.secondary,
    textTransform: "capitalize",
  },
  kvValue: {
    fontSize: 9,
    fontWeight: 500,
    color: colors.primary,
  },

  // Confidence bar
  confidenceBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginBottom: 6,
  },
  confidenceFill: {
    height: 10,
    borderRadius: 5,
  },
  confidenceGreen: { backgroundColor: colors.green },
  confidenceAmber: { backgroundColor: colors.amber },
  confidenceRed: { backgroundColor: colors.red },

  // Utility
  row: {
    flexDirection: "row",
  },
  gap4: {
    gap: 4,
  },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mt8: { marginTop: 8 },
  flex1: { flex: 1 },
});

export { colors };
