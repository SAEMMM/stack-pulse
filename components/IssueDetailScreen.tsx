import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { getAction, getImpactReason, getInterpretation, getSeverityColors, getSeverityLabel, getSummary } from "../lib/format";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { Badge } from "./Badge";

export function IssueDetailScreen({
  issue,
  state,
  mode,
  onBack,
  onToggleSaved,
  onMarkUnread,
}: {
  issue: Issue;
  state: IssueState;
  mode: LanguageMode;
  onBack: () => void;
  onToggleSaved: () => void;
  onMarkUnread: () => void;
}) {
  const severityColors = getSeverityColors(issue);
  const interpretation = getInterpretation(issue, mode);
  const actions = getAction(issue, mode);
  const summary = getSummary(issue, mode);
  const impactReason = getImpactReason(issue, mode);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>Back to feed</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Badge
          label={getSeverityLabel(issue)}
          backgroundColor={severityColors.bg}
          color={severityColors.text}
        />
        <Text style={styles.tags}>{issue.tags.join(" • ")}</Text>
      </View>

      <Text style={styles.originalLabel}>Original</Text>
      <Text style={styles.originalTitle}>{issue.originalTitle}</Text>

      <Section title="Summary">
        <Text style={styles.body}>{summary}</Text>
      </Section>

      <Section title="Interpretation">
        {interpretation.map((line) => (
          <Text key={line} style={styles.body}>
            • {line}
          </Text>
        ))}
      </Section>

      <Section title="Impact">
        <Text style={styles.body}>Impact level: {issue.impact.level}</Text>
        <Text style={styles.body}>Audience: {issue.impact.audience.join(", ")}</Text>
        <Text style={styles.body}>{impactReason}</Text>
      </Section>

      <Section title="Action">
        {actions.map((line) => (
          <Text key={line} style={styles.action}>
            • {line}
          </Text>
        ))}
      </Section>

      <Section title="Sources">
        {issue.sources.map((source) => (
          <Text key={source.url} style={styles.source}>
            • {source.title}
          </Text>
        ))}
      </Section>

      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButton} onPress={onToggleSaved}>
          <Text style={styles.primaryButtonText}>{state.isSaved ? "Remove saved" : "Save issue"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onMarkUnread}>
          <Text style={styles.secondaryButtonText}>Mark unread</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  back: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tags: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "700",
  },
  originalLabel: {
    color: colors.subtext,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.lg,
    textTransform: "uppercase",
  },
  originalTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    marginTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  action: {
    color: colors.accentStrong,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  source: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accentStrong,
    borderRadius: 999,
    paddingVertical: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.panelElevated,
    borderColor: colors.accentSoft,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
});
