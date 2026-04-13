import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { getLanguageModePreview } from "../lib/format";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { IssueCard } from "./IssueCard";

export function FeedScreen({
  issues,
  states,
  mode,
  stacks,
  onPressIssue,
  onToggleSaved,
}: {
  issues: Issue[];
  states: Record<string, IssueState>;
  mode: LanguageMode;
  stacks: string[];
  onPressIssue: (issue: Issue) => void;
  onToggleSaved: (issueId: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Today&apos;s Pulse</Text>
      <Text style={styles.title}>내 스택과 연결된 중요한 기술 이슈만 빠르게 봅니다.</Text>
      <Text style={styles.subtext}>
        선택된 스택: {stacks.join(", ")}. 요약보다 해석을 앞세워서 지금 판단이 필요한 이슈부터
        정렬합니다.
      </Text>
      <Text style={styles.languagePreview}>{getLanguageModePreview(mode)}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>How to read</Text>
        <Text style={styles.heroBody}>
          Original은 사실 확인용, Summary는 빠른 스캔용, Interpretation은 실무 판단용입니다.
        </Text>
      </View>

      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          state={states[issue.id]}
          mode={mode}
          onPress={() => onPressIssue(issue)}
          onToggleSaved={() => onToggleSaved(issue.id)}
        />
      ))}
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
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: spacing.sm,
  },
  subtext: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  languagePreview: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.panelAlt,
    borderRadius: 24,
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  heroLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
