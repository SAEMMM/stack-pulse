import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import {
  getAction,
  getActionLanguage,
  getInterpretation,
  getInterpretationLanguage,
  getLanguageLabel,
  getSeverityColors,
  getSeverityLabel,
  getSummary,
  getSummaryLanguage,
} from "../lib/format";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { Badge } from "./Badge";

export function IssueCard({
  issue,
  state,
  mode,
  onPress,
  onToggleSaved,
}: {
  issue: Issue;
  state: IssueState;
  mode: LanguageMode;
  onPress: () => void;
  onToggleSaved: () => void;
}) {
  const severityColors = getSeverityColors(issue);
  const interpretation = getInterpretation(issue, mode);
  const action = getAction(issue, mode);
  const summary = getSummary(issue, mode);
  const summaryLanguage = getLanguageLabel(getSummaryLanguage(mode));
  const interpretationLanguage = getLanguageLabel(getInterpretationLanguage(mode));
  const actionLanguage = getLanguageLabel(getActionLanguage(mode));

  return (
    <Pressable style={[styles.card, state.isRead && styles.readCard]} onPress={onPress}>
      <View style={styles.row}>
        <Badge
          label={getSeverityLabel(issue)}
          backgroundColor={severityColors.bg}
          color={severityColors.text}
        />
        <Text style={styles.meta}>{issue.tags.join(" • ")}</Text>
        <Pressable onPress={onToggleSaved} hitSlop={10}>
          <Text style={styles.save}>{state.isSaved ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>

      <Text style={styles.originalLabel}>Original</Text>
      <Text style={styles.originalTitle}>{issue.originalTitle}</Text>

      <Text style={styles.sectionLabel}>Summary · {summaryLanguage}</Text>
      <Text style={styles.summary}>{summary}</Text>

      <Text style={styles.sectionLabel}>Interpretation · {interpretationLanguage}</Text>
      {interpretation.slice(0, 2).map((line) => (
        <Text key={line} style={styles.body}>
          • {line}
        </Text>
      ))}

      <Text style={styles.sectionLabel}>Action · {actionLanguage}</Text>
      <Text style={styles.action}>{action[0]}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{issue.sourceCount} sources</Text>
        <Text style={styles.footerText}>{issue.readTime}</Text>
        {!state.isRead && <Text style={styles.unreadDot}>New</Text>}
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
  meta: {
    color: colors.subtext,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  save: {
    color: colors.accentStrong,
    fontSize: 13,
    fontWeight: "700",
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
  sectionLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  action: {
    color: colors.accentStrong,
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
});
