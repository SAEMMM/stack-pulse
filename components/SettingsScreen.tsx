import { ContentMeta, ContentSource, UserPreferences, UserSession } from "../types/app";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../constants/theme";
import { requestNotificationPermission, scheduleTestNotification } from "../lib/notifications";

import { formatShortDate } from "../lib/format";
import i18n from "../i18n";
import { runtimeConfig } from "../lib/runtimeConfig";
import { useTranslation } from "react-i18next";

export function SettingsScreen({
  availableStacks,
  apiBaseUrl,
  contentMeta,
  contentSource,
  debugFirstIssueId,
  isSyncingAccount,
  isRefreshingContent,
  lastAccountSyncSucceeded,
  preferences,
  onChange,
  onRefreshContent,
  userSession,
}: {
  availableStacks: string[];
  apiBaseUrl: string | null;
  contentMeta: ContentMeta;
  contentSource: ContentSource;
  debugFirstIssueId: string | null;
  isSyncingAccount: boolean;
  isRefreshingContent: boolean;
  lastAccountSyncSucceeded: boolean | null;
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
  onRefreshContent: () => Promise<boolean>;
  userSession: UserSession | null;
}) {
  const { t } = useTranslation();

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    onChange({
      ...preferences,
      notificationPermission: permission,
    });
  }

  async function sendTestNotification() {
    await scheduleTestNotification();
  }

  async function refreshContent() {
    await onRefreshContent();
  }

  function openExternal(url: string) {
    Linking.openURL(url).catch(() => undefined);
  }

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
        <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
        <Text style={styles.optionTitle}>{t("settings.accountGuestTitle")}</Text>
        <Text style={styles.optionBody}>
          {t("settings.accountGuestBody", {
            id: userSession?.userId ?? t("settings.accountMissing"),
          })}
        </Text>
        <Text style={styles.optionBody}>
          {isSyncingAccount
            ? t("settings.accountSyncing")
            : lastAccountSyncSucceeded === false
              ? t("settings.accountSyncFailed")
              : lastAccountSyncSucceeded === true
                ? t("settings.accountSynced")
                : t("settings.accountSyncIdle")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.content")}</Text>
        <Text style={styles.optionBody}>
          {t("settings.contentUpdated", {
            date: formatShortDate(contentMeta.lastUpdatedAt, preferences.uiLanguage),
          })}
        </Text>
        <Text style={styles.optionBody}>{t("settings.contentIssues", { count: contentMeta.issueCount })}</Text>
        <Text style={styles.optionBody}>{t("settings.contentSources", { count: contentMeta.sourceCount })}</Text>
        <Text style={styles.optionBody}>{t("settings.contentFallback", { count: contentMeta.fallbackSourceCount })}</Text>
        <Text style={styles.optionBody}>
          {t("settings.contentLive", {
            mode: contentMeta.fetchMode,
            enrichment: contentMeta.enrichmentMode,
          })}
        </Text>
        <Text style={styles.optionBody}>{t(`settings.contentSource.${contentSource}`)}</Text>
        <Text style={styles.optionBody}>
          {t("settings.apiEndpoint", {
            endpoint: apiBaseUrl ?? t("settings.apiEndpointMissing"),
          })}
        </Text>
        <Text style={styles.optionBody}>
          {t("settings.debugFirstIssue", {
            id: debugFirstIssueId ?? t("settings.accountMissing"),
          })}
        </Text>
        <Pressable
          style={[styles.actionButton, isRefreshingContent && styles.actionButtonDisabled]}
          disabled={isRefreshingContent}
          onPress={refreshContent}
        >
          <Text style={styles.actionButtonText}>
            {isRefreshingContent ? t("settings.refreshingContent") : t("settings.refreshContent")}
          </Text>
        </Pressable>
      </View>

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
        <Text style={styles.sectionTitle}>{t("settings.notifications")}</Text>
        <Text style={styles.optionBody}>
          {preferences.notificationPermission === "granted"
            ? t("settings.notificationGranted")
            : preferences.notificationPermission === "denied"
              ? t("settings.notificationDenied")
              : t("settings.notificationUndetermined")}
        </Text>
        {preferences.notificationPermission !== "granted" && (
          <Pressable style={styles.actionButton} onPress={enableNotifications}>
            <Text style={styles.actionButtonText}>{t("settings.requestPermission")}</Text>
          </Pressable>
        )}
        {preferences.notificationPermission === "granted" && (
          <Pressable style={styles.actionButton} onPress={sendTestNotification}>
            <Text style={styles.actionButtonText}>{t("settings.sendTest")}</Text>
          </Pressable>
        )}
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

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.legal")}</Text>
        <Pressable style={styles.linkRow} onPress={() => openExternal(runtimeConfig.privacyPolicyUrl)}>
          <Text style={styles.linkText}>{t("settings.privacyPolicy")}</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => openExternal(runtimeConfig.termsUrl)}>
          <Text style={styles.linkText}>{t("settings.termsOfService")}</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => openExternal(`mailto:${runtimeConfig.supportEmail}`)}>
          <Text style={styles.linkText}>{t("settings.contactSupport")}</Text>
        </Pressable>
      </View> */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.advertising")}</Text>
        <Text style={styles.optionTitle}>{t("settings.advertisingTitle")}</Text>
        <Text style={styles.optionBody}>{t("settings.advertisingBody")}</Text>
        <Text style={styles.optionBody}>
          {runtimeConfig.adsEnabled
            ? t("settings.advertisingStatusOn")
            : t("settings.advertisingStatusOff")}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{t("settings.footerTitle")}</Text>
        <Text style={styles.footerText}>{t("settings.footerDeveloper")}</Text>
        <Text style={styles.footerText}>{t("settings.footerContact")}</Text>
        <Text style={styles.footerText}>{t("settings.footerCopyright")}</Text>
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
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: colors.accentStrong,
    fontSize: 14,
    fontWeight: "800",
  },
  actionButtonDisabled: {
    opacity: 0.6,
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
  linkRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  linkText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  footerTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  footerText: {
    color: colors.subtext,
    fontSize: 13,
    lineHeight: 20,
  },
});
