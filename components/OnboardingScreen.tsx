import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import i18n from "../i18n";
import { UiLanguage, UserPreferences, UserRole } from "../types/app";

export function OnboardingScreen({
  availableStacks,
  onComplete,
}: {
  availableStacks: string[];
  onComplete: (value: UserPreferences) => void;
}) {
  const { t } = useTranslation();
  const [role, setRole] = useState<UserRole>("frontend");
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>("ko");
  const [pushLevel, setPushLevel] = useState<UserPreferences["pushLevel"]>("important_only");
  const [stacks, setStacks] = useState<string[]>(["React", "Next.js", "TypeScript"]);
  const roleOptions: { title: string; body: string; value: UserRole }[] = [
    {
      title: t("onboarding.roles.frontendTitle"),
      body: t("onboarding.roles.frontendBody"),
      value: "frontend",
    },
    {
      title: t("onboarding.roles.fullstackTitle"),
      body: t("onboarding.roles.fullstackBody"),
      value: "fullstack",
    },
    {
      title: t("onboarding.roles.leadTitle"),
      body: t("onboarding.roles.leadBody"),
      value: "tech_lead",
    },
  ];

  function toggleStack(stack: string) {
    setStacks((prev) =>
      prev.includes(stack) ? prev.filter((item) => item !== stack) : [...prev, stack],
    );
  }

  function changeUiLanguage(next: UiLanguage) {
    setUiLanguage(next);
    i18n.changeLanguage(next);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>StackPulse MVP</Text>
      <View style={styles.languageSwitch}>
        <Text style={styles.languageLabel}>{t("onboarding.uiLanguage")}</Text>
        <View style={styles.languageChips}>
          <Pressable
            style={[styles.languageChip, uiLanguage === "ko" && styles.languageChipSelected]}
            onPress={() => changeUiLanguage("ko")}
          >
            <Text style={[styles.languageChipText, uiLanguage === "ko" && styles.languageChipTextSelected]}>
              {t("common.korean")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.languageChip, uiLanguage === "en" && styles.languageChipSelected]}
            onPress={() => changeUiLanguage("en")}
          >
            <Text style={[styles.languageChipText, uiLanguage === "en" && styles.languageChipTextSelected]}>
              {t("common.english")}
            </Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.title}>{t("onboarding.title")}</Text>
      <Text style={styles.description}>{t("onboarding.description")}</Text>

      <SectionTitle title={t("onboarding.roleTitle")} />
      {roleOptions.map((option) => (
        <SelectableCard
          key={option.value}
          title={option.title}
          body={option.body}
          selected={role === option.value}
          onPress={() => setRole(option.value)}
        />
      ))}

      <SectionTitle title={t("onboarding.stacksTitle")} />
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

      <SectionTitle title={t("onboarding.pushTitle")} />
      <SelectableCard
        title={t("onboarding.push.importantOnlyTitle")}
        body={t("onboarding.push.importantOnlyBody")}
        selected={pushLevel === "important_only"}
        onPress={() => setPushLevel("important_only")}
      />
      <SelectableCard
        title={t("onboarding.push.importantMajorTitle")}
        body={t("onboarding.push.importantMajorBody")}
        selected={pushLevel === "important_and_major"}
        onPress={() => setPushLevel("important_and_major")}
      />

      <Pressable
        style={styles.button}
        onPress={() =>
          onComplete({
            role,
            uiLanguage,
            languageMode: uiLanguage === "en" ? "full_en" : "en_source_ko_all",
            pushLevel,
            stacks,
            hideReadIssues: false,
          })
        }
      >
        <Text style={styles.buttonText}>{t("onboarding.start")}</Text>
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
  languageSwitch: {
    alignItems: "flex-start",
    marginTop: spacing.lg,
  },
  languageLabel: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  languageChips: {
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    padding: 4,
  },
  languageChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageChipSelected: {
    backgroundColor: colors.accentSoft,
  },
  languageChipText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "800",
  },
  languageChipTextSelected: {
    color: colors.accentStrong,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.md,
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
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  selectCardSelected: {
    backgroundColor: colors.panelAlt,
    borderColor: colors.accentStrong,
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
    backgroundColor: colors.panelElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: colors.accentStrong,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.accentStrong,
    borderRadius: 999,
    marginTop: spacing.xl,
    paddingVertical: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "800",
  },
});
