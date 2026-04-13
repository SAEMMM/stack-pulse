import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { getLanguageModePreview } from "../lib/format";
import { Issue, IssueState, LanguageMode } from "../types/app";
import { IssueCard } from "./IssueCard";

type FeedFilter = "all" | "my_stack" | "security" | "breaking" | "unread";

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
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const filterOptions = useMemo(
    () => [
      { key: "all" as const, label: "All", count: issues.length },
      {
        key: "my_stack" as const,
        label: "My Stack",
        count: issues.filter((issue) => issue.tags.some((tag) => stacks.includes(tag))).length,
      },
      {
        key: "security" as const,
        label: "Security",
        count: issues.filter((issue) => issue.severity === "security").length,
      },
      {
        key: "breaking" as const,
        label: "Breaking",
        count: issues.filter((issue) => issue.severity === "breaking").length,
      },
      {
        key: "unread" as const,
        label: "Unread",
        count: issues.filter((issue) => !states[issue.id]?.isRead).length,
      },
    ],
    [issues, stacks, states],
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

      <View style={styles.filterSummaryRow}>
        <Text style={styles.filterSummary}>
          {activeFilter === "all" && "전체 이슈를 우선순위 기준으로 보여줍니다."}
          {activeFilter === "my_stack" && "내 스택과 직접 연결된 이슈만 모아봅니다."}
          {activeFilter === "security" && "보안 대응이 필요한 이슈만 빠르게 확인합니다."}
          {activeFilter === "breaking" && "호환성이나 개발 규칙 변화 가능성이 큰 이슈입니다."}
          {activeFilter === "unread" && "아직 읽지 않은 이슈만 다시 정리합니다."}
        </Text>
        <Text style={styles.filterMeta}>{filteredIssues.length} issues</Text>
      </View>

      {filteredIssues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>현재 조건에 맞는 이슈가 없습니다.</Text>
          <Text style={styles.emptyBody}>
            스택 선택을 넓히거나 다른 필터로 전환하면 더 많은 이슈를 볼 수 있습니다.
          </Text>
        </View>
      ) : (
        filteredIssues.map((issue) => (
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
    borderColor: colors.border,
    borderWidth: 1,
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
  filterSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterSummary: {
    color: colors.subtext,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  filterMeta: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "800",
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
