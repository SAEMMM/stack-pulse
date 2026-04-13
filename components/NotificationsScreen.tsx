import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { getSeverityColors, getSeverityLabel } from "../lib/format";
import { Issue } from "../types/app";
import { Badge } from "./Badge";

export function NotificationsScreen({
  issues,
  onOpen,
}: {
  issues: Issue[];
  onOpen: (issue: Issue) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>푸시 기준으로 발송된 중요 이슈 기록입니다.</Text>
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
              <Text style={styles.timestamp}>{new Date(issue.publishedAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.original}>{issue.originalTitle}</Text>
            <Text style={styles.summary}>{issue.summary.ko}</Text>
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
