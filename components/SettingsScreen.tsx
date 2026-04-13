import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { availableStacks } from "../data/mockIssues";
import { colors, spacing } from "../constants/theme";
import { UserPreferences } from "../types/app";

export function SettingsScreen({
  preferences,
  onChange,
}: {
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
}) {
  function toggleStack(stack: string) {
    const stacks = preferences.stacks.includes(stack)
      ? preferences.stacks.filter((item) => item !== stack)
      : [...preferences.stacks, stack];

    onChange({ ...preferences, stacks });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>개인화 기준을 바꾸면 피드 우선순위와 표현 언어가 함께 달라집니다.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language mode</Text>
        <Pressable
          style={[styles.option, preferences.languageMode === "full_en" && styles.optionSelected]}
          onPress={() => onChange({ ...preferences, languageMode: "full_en" })}
        >
          <Text style={styles.optionTitle}>Full English</Text>
          <Text style={styles.optionBody}>원문, 요약, 해석, 액션 모두 영어</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            preferences.languageMode === "en_source_ko_all" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, languageMode: "en_source_ko_all" })}
        >
          <Text style={styles.optionTitle}>English source + Korean guide</Text>
          <Text style={styles.optionBody}>원문은 영어, 판단 정보는 한국어</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            preferences.languageMode === "en_summary_ko_interpretation" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, languageMode: "en_summary_ko_interpretation" })}
        >
          <Text style={styles.optionTitle}>English summary + Korean interpretation</Text>
          <Text style={styles.optionBody}>영어 감각 유지 + 해석은 한국어</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My stacks</Text>
        <View style={styles.chips}>
          {availableStacks.map((stack) => {
            const selected = preferences.stacks.includes(stack);
            return (
              <Pressable
                key={stack}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleStack(stack)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{stack}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push level</Text>
        <Pressable
          style={[
            styles.option,
            preferences.pushLevel === "important_only" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, pushLevel: "important_only" })}
        >
          <Text style={styles.optionTitle}>중요 이슈만</Text>
          <Text style={styles.optionBody}>Security / Breaking 위주 알림</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            preferences.pushLevel === "important_and_major" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, pushLevel: "important_and_major" })}
        >
          <Text style={styles.optionTitle}>중요 + 주요</Text>
          <Text style={styles.optionBody}>Major까지 포함해 더 넓게 수신</Text>
        </Pressable>
      </View>
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
  section: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  option: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  optionBody: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
});
