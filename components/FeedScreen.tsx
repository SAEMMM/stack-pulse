import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import { Issue, IssueState, LanguageMode, UiLanguage, UserRole } from "../types/app";
import { IssueCard } from "./IssueCard";

type FeedFilter = "all" | "my_stack" | "security" | "breaking" | "unread";

export function FeedScreen({
  issues,
  states,
  mode,
  uiLanguage,
  stacks,
  role,
  onPressIssue,
  onToggleSaved,
  onChangeUiLanguage,
}: {
  issues: Issue[];
  states: Record<string, IssueState>;
  mode: LanguageMode;
  uiLanguage: UiLanguage;
  stacks: string[];
  role: UserRole;
  onPressIssue: (issue: Issue) => void;
  onToggleSaved: (issueId: string) => void;
  onChangeUiLanguage: (language: UiLanguage) => void;
}) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const filterOptions = useMemo(
    () => [
      { key: "all" as const, label: t("feed.filters.all"), count: issues.length },
      {
        key: "my_stack" as const,
        label: t("feed.filters.myStack"),
        count: issues.filter((issue) => issue.tags.some((tag) => stacks.includes(tag))).length,
      },
      {
        key: "security" as const,
        label: t("feed.filters.security"),
        count: issues.filter((issue) => issue.severity === "security").length,
      },
      {
        key: "breaking" as const,
        label: t("feed.filters.breaking"),
        count: issues.filter((issue) => issue.severity === "breaking").length,
      },
      {
        key: "unread" as const,
        label: t("feed.filters.unread"),
        count: issues.filter((issue) => !states[issue.id]?.isRead).length,
      },
    ],
    [issues, stacks, states, t],
  );

  const filteredIssues = useMemo(() => {
    if (activeFilter === "my_stack") {
      return issues.filter((issue) => issue.tags.some((tag) => stacks.includes(tag)));
    }
    if (activeFilter === "security") {
      return issues.filter((issue) => issue.severity === "security");
    }
    if (activeFilter === "breaking") {
      return issues.filter((issue) => issue.severity === "breaking");
    }
    if (activeFilter === "unread") {
      return issues.filter((issue) => !states[issue.id]?.isRead);
    }
    return issues;
  }, [activeFilter, issues, stacks, states]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>{t("feed.kicker")}</Text>
      <View style={styles.languageSwitch}>
        <Pressable
          style={[styles.languageChip, uiLanguage === "ko" && styles.languageChipActive]}
          onPress={() => onChangeUiLanguage("ko")}
        >
          <Text style={[styles.languageChipText, uiLanguage === "ko" && styles.languageChipTextActive]}>
            {t("common.korean")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.languageChip, uiLanguage === "en" && styles.languageChipActive]}
          onPress={() => onChangeUiLanguage("en")}
        >
          <Text style={[styles.languageChipText, uiLanguage === "en" && styles.languageChipTextActive]}>
            {t("common.english")}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{t("feed.title")}</Text>

      <View style={styles.filterRow}>
        {filterOptions.map((filter) => {
          const selected = filter.key === activeFilter;
          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>
                {filter.label}
              </Text>
              <View style={[styles.filterCount, selected && styles.filterCountSelected]}>
                <Text style={[styles.filterCountText, selected && styles.filterCountTextSelected]}>
                  {filter.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {filteredIssues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t("feed.emptyTitle")}</Text>
          <Text style={styles.emptyBody}>{t("feed.emptyBody")}</Text>
        </View>
      ) : (
        filteredIssues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            state={states[issue.id]}
            mode={mode}
            stacks={stacks}
            role={role}
            variant="compact"
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
  kicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  languageSwitch: {
    alignSelf: "flex-start",
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: 4,
  },
  languageChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageChipActive: {
    backgroundColor: colors.accentSoft,
  },
  languageChipText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "800",
  },
  languageChipTextActive: {
    color: colors.accentStrong,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
  },
  filterLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  filterLabelSelected: {
    color: colors.accentStrong,
  },
  filterCount: {
    alignItems: "center",
    backgroundColor: colors.panelAlt,
    borderRadius: 999,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  filterCountSelected: {
    backgroundColor: colors.accent,
  },
  filterCountText: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "800",
  },
  filterCountTextSelected: {
    color: colors.bg,
  },
  emptyState: {
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
});
