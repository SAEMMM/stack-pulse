import { ScrollView, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import { Issue, IssueState, LanguageMode, UserRole } from "../types/app";
import { IssueCard } from "./IssueCard";

export function SavedScreen({
  issues,
  states,
  mode,
  stacks,
  role,
  onPressIssue,
  onToggleSaved,
}: {
  issues: Issue[];
  states: Record<string, IssueState>;
  mode: LanguageMode;
  stacks: string[];
  role: UserRole;
  onPressIssue: (issue: Issue) => void;
  onToggleSaved: (issueId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("saved.title")}</Text>
      <Text style={styles.subtitle}>{t("saved.subtitle")}</Text>
      {issues.length === 0 ? (
        <Text style={styles.empty}>{t("saved.empty")}</Text>
      ) : (
        issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            state={states[issue.id]}
            mode={mode}
            stacks={stacks}
            role={role}
            variant="expanded"
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
