import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import { getDisplayTitle, getSeverityColors, getSeverityLabel } from "../lib/format";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { Badge } from "./Badge";

export function NotificationsScreen({
  issues,
  onOpen,
  states,
  pushLevel,
  mode,
}: {
  issues: Issue[];
  onOpen: (issue: Issue) => void;
  states: Record<string, IssueState>;
  pushLevel: "important_only" | "important_and_major";
  mode: LanguageMode;
}) {
  const { t, i18n } = useTranslation();
  const english = i18n.language === "en";
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("notifications.title")}</Text>
      <Text style={styles.subtitle}>
        {pushLevel === "important_only"
          ? t("notifications.importantOnly")
          : t("notifications.importantMajor")}
      </Text>
      {issues.map((issue) => {
        const severityColors = getSeverityColors(issue);
        return (
          <Pressable key={issue.id} style={styles.item} onPress={() => onOpen(issue)}>
            <View style={styles.itemTop}>
              <Badge
                label={getSeverityLabel(issue)}
                backgroundColor={severityColors.bg}
                color={severityColors.text}
              />
              <Text style={styles.timestamp}>
                {states[issue.id]?.isRead ? t("notifications.read") : t("notifications.unread")}{" "}
                ·{" "}
                {new Date(issue.publishedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.original}>{getDisplayTitle(issue, mode)}</Text>
            <Text style={styles.summary}>{english ? issue.summary.en : issue.summary.ko}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  item: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  itemTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  timestamp: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "700",
  },
  original: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  summary: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
