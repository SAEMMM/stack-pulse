import { useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native";
import { FeedScreen } from "./components/FeedScreen";
import { IssueDetailScreen } from "./components/IssueDetailScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SavedScreen } from "./components/SavedScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TabBar } from "./components/TabBar";
import { colors } from "./constants/theme";
import { useStackPulseApp } from "./hooks/useStackPulseApp";
import "./i18n";
import i18n from "./i18n";
import { UiLanguage } from "./types/app";

export default function App() {
  const app = useStackPulseApp();

  useEffect(() => {
    i18n.changeLanguage(app.preferences.uiLanguage);
  }, [app.preferences.uiLanguage]);

  function changeUiLanguage(language: UiLanguage) {
    app.setPreferences({
      ...app.preferences,
      uiLanguage: language,
      languageMode: language === "en" ? "full_en" : "en_source_ko_all",
    });
  }

  if (!app.isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accentStrong} size="small" />
          <Text style={styles.loadingText}>Loading StackPulse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!app.isOnboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <OnboardingScreen onComplete={app.completeOnboarding} />
      </SafeAreaView>
    );
  }

  if (app.selectedIssue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <IssueDetailScreen
          issue={app.selectedIssue}
          state={app.states[app.selectedIssue.id]}
          mode={app.preferences.languageMode}
          onBack={() => app.setSelectedIssue(null)}
          onToggleSaved={() => app.toggleSaved(app.selectedIssue!.id)}
          onMarkUnread={() => app.markUnread(app.selectedIssue!.id)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {app.currentTab === "feed" && (
          <FeedScreen
            issues={app.sortedIssues}
            states={app.states}
            mode={app.preferences.languageMode}
            uiLanguage={app.preferences.uiLanguage}
            stacks={app.preferences.stacks}
            role={app.preferences.role}
            onPressIssue={app.openIssue}
            onToggleSaved={app.toggleSaved}
            onChangeUiLanguage={changeUiLanguage}
          />
        )}

        {app.currentTab === "saved" && (
          <SavedScreen
            issues={app.savedIssues}
            states={app.states}
            mode={app.preferences.languageMode}
            stacks={app.preferences.stacks}
            role={app.preferences.role}
            onPressIssue={app.openIssue}
            onToggleSaved={app.toggleSaved}
          />
        )}

        {app.currentTab === "notifications" && (
          <NotificationsScreen
            issues={app.notifications}
            onOpen={app.openIssue}
            states={app.states}
            pushLevel={app.preferences.pushLevel}
            mode={app.preferences.languageMode}
          />
        )}

        {app.currentTab === "settings" && (
          <SettingsScreen preferences={app.preferences} onChange={app.setPreferences} />
        )}

        <TabBar
          currentTab={app.currentTab}
          mode={app.preferences.uiLanguage}
          onChange={app.setCurrentTab}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: colors.subtext,
    fontSize: 14,
    fontWeight: "600",
  },
});
