import { ScrollView, StyleSheet, Text } from "react-native";
import { colors, spacing } from "../constants/theme";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { IssueCard } from "./IssueCard";

export function SavedScreen({
  issues,
  states,
  mode,
  onPressIssue,
  onToggleSaved,
}: {
  issues: Issue[];
  states: Record<string, IssueState>;
  mode: LanguageMode;
  onPressIssue: (issue: Issue) => void;
  onToggleSaved: (issueId: string) => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Saved issues</Text>
      <Text style={styles.subtitle}>다시 검토하거나 팀에 공유할 이슈를 모아둡니다.</Text>
      {issues.length === 0 ? (
        <Text style={styles.empty}>저장된 이슈가 아직 없습니다.</Text>
      ) : (
        issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            state={states[issue.id]}
            mode={mode}
            onPress={() => onPressIssue(issue)}
            onToggleSaved={() => onToggleSaved(issue.id)}
          />
        ))
      )}
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
  empty: {
    color: colors.subtext,
    fontSize: 16,
    marginTop: spacing.lg,
  },
});
