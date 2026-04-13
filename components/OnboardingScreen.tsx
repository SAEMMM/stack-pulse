import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { availableStacks } from "../lib/issues";
import { LanguageMode, UserPreferences, UserRole } from "../types/app";

const roleOptions: { label: string; value: UserRole; caption: string }[] = [
  { label: "Frontend", value: "frontend", caption: "React / Next.js 중심" },
  { label: "Fullstack", value: "fullstack", caption: "프론트 + 서버 관심" },
  { label: "Tech Lead", value: "tech_lead", caption: "팀 영향도 판단 중심" },
];

const languageOptions: { label: string; value: LanguageMode; caption: string }[] = [
  { label: "English only", value: "full_en", caption: "원문과 설명 모두 영어" },
  {
    label: "English source + Korean guide",
    value: "en_source_ko_all",
    caption: "원문은 영어, 요약/해석/액션은 한국어",
  },
  {
    label: "English summary + Korean interpretation",
    value: "en_summary_ko_interpretation",
    caption: "원문/요약은 영어 감각 유지, 해석은 한국어",
  },
];

export function OnboardingScreen({
  onComplete,
}: {
  onComplete: (value: UserPreferences) => void;
}) {
  const [role, setRole] = useState<UserRole>("frontend");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("en_source_ko_all");
  const [pushLevel, setPushLevel] = useState<UserPreferences["pushLevel"]>("important_only");
  const [stacks, setStacks] = useState<string[]>(["React", "Next.js", "TypeScript"]);

  function toggleStack(stack: string) {
    setStacks((prev) =>
      prev.includes(stack) ? prev.filter((item) => item !== stack) : [...prev, stack],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>StackPulse MVP</Text>
      <Text style={styles.title}>뉴스 앱이 아니라, 개발자 판단 앱으로 시작합니다.</Text>
      <Text style={styles.description}>
        원문은 영어로 유지하고, 요약보다 해석을 앞세워서 지금 무엇을 해야 하는지 빠르게 판단하게
        돕습니다.
      </Text>

      <SectionTitle title="1. 어떤 역할에 더 가깝나요?" />
      {roleOptions.map((option) => (
        <SelectableCard
          key={option.value}
          title={option.label}
          body={option.caption}
          selected={role === option.value}
          onPress={() => setRole(option.value)}
        />
      ))}

      <SectionTitle title="2. 어떤 언어 모드가 편한가요?" />
      {languageOptions.map((option) => (
        <SelectableCard
          key={option.value}
          title={option.label}
          body={option.caption}
          selected={languageMode === option.value}
          onPress={() => setLanguageMode(option.value)}
        />
      ))}

      <SectionTitle title="3. 지금 가장 중요한 스택을 선택하세요" />
      <View style={styles.chips}>
        {availableStacks.map((stack) => (
          <Pressable
            key={stack}
            style={[styles.chip, stacks.includes(stack) && styles.chipSelected]}
            onPress={() => toggleStack(stack)}
          >
            <Text style={[styles.chipText, stacks.includes(stack) && styles.chipTextSelected]}>
              {stack}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="4. 푸시는 어디까지 받을까요?" />
      <SelectableCard
        title="중요 이슈만"
        body="Security / Breaking 중심으로 받기"
        selected={pushLevel === "important_only"}
        onPress={() => setPushLevel("important_only")}
      />
      <SelectableCard
        title="중요 + 주요 업데이트"
        body="Major 이슈도 함께 받기"
        selected={pushLevel === "important_and_major"}
        onPress={() => setPushLevel("important_and_major")}
      />

      <Pressable
        style={styles.button}
        onPress={() =>
          onComplete({
            role,
            languageMode,
            pushLevel,
            stacks,
          })
        }
      >
        <Text style={styles.buttonText}>개인화 피드 시작</Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SelectableCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.selectCard, selected && styles.selectCardSelected]} onPress={onPress}>
      <Text style={styles.selectTitle}>{title}</Text>
      <Text style={styles.selectBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.lg,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.subtext,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  selectCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  selectCardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  selectTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  selectBody: {
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
    backgroundColor: colors.panel,
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
  button: {
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: 999,
    marginTop: spacing.xl,
    paddingVertical: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
