import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import {
  getImpactColors,
  getImpactLabel,
  getDisplayTitle,
  getSeverityColors,
  getSeverityLabel,
  getPrimaryKeyLine,
  getSummary,
} from "../lib/format";
import { Issue, IssueState, LanguageMode, UserRole } from "../types/app";
import { Badge } from "./Badge";

export function IssueCard({
  issue,
  state,
  mode,
  stacks,
  role,
  variant = "compact",
  onPress,
  onToggleSaved,
}: {
  issue: Issue;
  state: IssueState;
  mode: LanguageMode;
  stacks: string[];
  role: UserRole;
  variant?: "compact" | "expanded";
  onPress: () => void;
  onToggleSaved: () => void;
}) {
  const { t } = useTranslation();
  const severityColors = getSeverityColors(issue);
  const impactColors = getImpactColors(issue);
  const keyLine = getPrimaryKeyLine(issue, mode);
  const displayTitle = getDisplayTitle(issue, mode);
  const summary = getSummary(issue, mode);
  const originalLabel = t("common.headline");
  const keyPointLabel = t("common.keyPoint");
  const saveLabel = state.isSaved
    ? t("common.saved")
    : t("common.save");
  const newLabel = t("common.new");

  return (
    <Pressable style={[styles.card, state.isRead && styles.readCard]} onPress={onPress}>
      <View style={styles.row}>
        <Badge
          label={getSeverityLabel(issue)}
          backgroundColor={severityColors.bg}
          color={severityColors.text}
        />
        {!state.isRead && <Text style={styles.unreadDotInline}>{newLabel}</Text>}
        <View style={styles.rowSpacer} />
        <Pressable onPress={onToggleSaved} hitSlop={10}>
          <Text style={styles.save}>{saveLabel}</Text>
        </Pressable>
      </View>

      {variant === "compact" ? null : (
        <View style={styles.impactRow}>
          <View style={[styles.impactPill, { backgroundColor: impactColors.bg }]}>
            <Text style={[styles.impactPillText, { color: impactColors.text }]}>
              {getImpactLabel(issue)}
            </Text>
          </View>
        </View>
      )}

      {variant === "compact" ? (
        <>
          <Text numberOfLines={2} style={styles.compactSummary}>
            {summary}
          </Text>
          <Text numberOfLines={1} style={styles.compactHeadline}>
            {displayTitle}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.originalLabel}>{originalLabel}</Text>
          <Text style={styles.originalTitle}>{displayTitle}</Text>
        </>
      )}

      {variant === "compact" ? (
        <>
          <Text numberOfLines={1} style={styles.keyLine}>
            {keyLine}
          </Text>
          <Text numberOfLines={1} style={styles.compactMeta}>
            {issue.tags.slice(0, 2).join(" • ")}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.keyLineLabel}>{keyPointLabel}</Text>
          <Text style={styles.keyLineExpanded}>{keyLine}</Text>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("common.sourceCount", { count: issue.sourceCount })}</Text>
        <Text style={styles.footerText}>{issue.readTime}</Text>
        {!state.isRead && <Text style={styles.unreadDot}>{newLabel}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 6,
  },
  readCard: {
    opacity: 0.88,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowSpacer: {
    flex: 1,
  },
  save: {
    color: colors.accentStrong,
    fontSize: 13,
    fontWeight: "700",
  },
  impactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  impactPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  impactPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  originalLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  originalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  compactSummary: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25,
    marginTop: spacing.xs,
  },
  compactHeadline: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  keyLine: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  compactMeta: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  keyLineLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  keyLineExpanded: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footerText: {
    color: colors.subtext,
    fontSize: 12,
  },
  unreadDot: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: "auto",
  },
  unreadDotInline: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "800",
  },
});
