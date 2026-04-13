import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FeedScreen } from "./components/FeedScreen";
import { IssueDetailScreen } from "./components/IssueDetailScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SavedScreen } from "./components/SavedScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TabBar } from "./components/TabBar";
import { colors } from "./constants/theme";
import { useStackPulseApp } from "./hooks/useStackPulseApp";

export default function App() {
  const app = useStackPulseApp();

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
            stacks={app.preferences.stacks}
            onPressIssue={app.openIssue}
            onToggleSaved={app.toggleSaved}
            hideReadIssues={app.preferences.hideReadIssues}
          />
        )}

        {app.currentTab === "saved" && (
          <SavedScreen
            issues={app.savedIssues}
            states={app.states}
            mode={app.preferences.languageMode}
            onPressIssue={app.openIssue}
            onToggleSaved={app.toggleSaved}
          />
        )}

        {app.currentTab === "notifications" && (
          <NotificationsScreen
            issues={app.notifications}
            onOpen={app.openIssue}
            states={app.states}
          />
        )}

        {app.currentTab === "settings" && (
          <SettingsScreen preferences={app.preferences} onChange={app.setPreferences} />
        )}

        <TabBar currentTab={app.currentTab} onChange={app.setCurrentTab} />
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
});
