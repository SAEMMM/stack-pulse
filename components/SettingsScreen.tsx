import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, spacing } from "../constants/theme";
import i18n from "../i18n";
import { availableStacks } from "../lib/issues";
import { UserPreferences } from "../types/app";

export function SettingsScreen({
  preferences,
  onChange,
}: {
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
}) {
  const { t } = useTranslation();
  function toggleStack(stack: string) {
    const stacks = preferences.stacks.includes(stack)
      ? preferences.stacks.filter((item) => item !== stack)
      : [...preferences.stacks, stack];

    onChange({ ...preferences, stacks });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("settings.title")}</Text>
      <Text style={styles.subtitle}>{t("settings.subtitle")}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.uiLanguage")}</Text>
        <View style={styles.languageRow}>
          <Pressable
            style={[styles.languageChip, preferences.uiLanguage === "ko" && styles.languageChipSelected]}
            onPress={() => {
              i18n.changeLanguage("ko");
              onChange({
                ...preferences,
                uiLanguage: "ko",
                languageMode:
                  preferences.languageMode === "full_en" ? "en_source_ko_all" : preferences.languageMode,
              });
            }}
          >
            <Text style={[styles.languageChipText, preferences.uiLanguage === "ko" && styles.languageChipTextSelected]}>
              {t("common.korean")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.languageChip, preferences.uiLanguage === "en" && styles.languageChipSelected]}
            onPress={() => {
              i18n.changeLanguage("en");
              onChange({
                ...preferences,
                uiLanguage: "en",
                languageMode: "full_en",
              });
            }}
          >
            <Text style={[styles.languageChipText, preferences.uiLanguage === "en" && styles.languageChipTextSelected]}>
              {t("common.english")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.myStacks")}</Text>
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
        <Text style={styles.sectionTitle}>{t("settings.pushLevel")}</Text>
        <Pressable
          style={[
            styles.option,
            preferences.pushLevel === "important_only" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, pushLevel: "important_only" })}
        >
          <Text style={styles.optionTitle}>{t("settings.importantOnlyTitle")}</Text>
          <Text style={styles.optionBody}>{t("settings.importantOnlyBody")}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            preferences.pushLevel === "important_and_major" && styles.optionSelected,
          ]}
          onPress={() => onChange({ ...preferences, pushLevel: "important_and_major" })}
        >
          <Text style={styles.optionTitle}>{t("settings.importantMajorTitle")}</Text>
          <Text style={styles.optionBody}>{t("settings.importantMajorBody")}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.feedBehavior")}</Text>
        <Pressable
          style={[styles.option, preferences.hideReadIssues && styles.optionSelected]}
          onPress={() =>
            onChange({ ...preferences, hideReadIssues: !preferences.hideReadIssues })
          }
        >
          <Text style={styles.optionTitle}>{t("settings.hideReadTitle")}</Text>
          <Text style={styles.optionBody}>
            {preferences.hideReadIssues ? t("settings.hideReadOn") : t("settings.hideReadOff")}
          </Text>
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
  languageRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  languageChip: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  languageChipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
  },
  languageChipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  languageChipTextSelected: {
    color: colors.accentStrong,
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
