import AsyncStorage from "@react-native-async-storage/async-storage";
import { ContentBundle, IssueState, UserPreferences } from "../types/app";

const STORAGE_KEYS = {
  isOnboarded: "stackpulse:isOnboarded",
  preferences: "stackpulse:preferences",
  issueStates: "stackpulse:issueStates",
  contentBundle: "stackpulse:contentBundle",
} as const;

type PersistedAppState = {
  isOnboarded: boolean;
  preferences: UserPreferences | null;
  issueStates: Record<string, IssueState> | null;
  contentBundle: ContentBundle | null;
};

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const [isOnboardedRaw, preferencesRaw, issueStatesRaw, contentBundleRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.isOnboarded),
    AsyncStorage.getItem(STORAGE_KEYS.preferences),
    AsyncStorage.getItem(STORAGE_KEYS.issueStates),
    AsyncStorage.getItem(STORAGE_KEYS.contentBundle),
  ]);

  return {
    isOnboarded: isOnboardedRaw === "true",
    preferences: preferencesRaw ? (JSON.parse(preferencesRaw) as UserPreferences) : null,
    issueStates: issueStatesRaw
      ? (JSON.parse(issueStatesRaw) as Record<string, IssueState>)
      : null,
    contentBundle: contentBundleRaw ? (JSON.parse(contentBundleRaw) as ContentBundle) : null,
  };
}

export async function persistIsOnboarded(value: boolean) {
  await AsyncStorage.setItem(STORAGE_KEYS.isOnboarded, String(value));
}

export async function persistPreferences(value: UserPreferences) {
  await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(value));
}

export async function persistIssueStates(value: Record<string, IssueState>) {
  await AsyncStorage.setItem(STORAGE_KEYS.issueStates, JSON.stringify(value));
}

export async function persistContentBundle(value: ContentBundle) {
  await AsyncStorage.setItem(STORAGE_KEYS.contentBundle, JSON.stringify(value));
}
