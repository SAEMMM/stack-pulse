import AsyncStorage from "@react-native-async-storage/async-storage";
import { IssueState, UserPreferences } from "../types/app";

const STORAGE_KEYS = {
  isOnboarded: "stackpulse:isOnboarded",
  preferences: "stackpulse:preferences",
  issueStates: "stackpulse:issueStates",
} as const;

type PersistedAppState = {
  isOnboarded: boolean;
  preferences: UserPreferences | null;
  issueStates: Record<string, IssueState> | null;
};

export async function loadPersistedAppState(): Promise<PersistedAppState> {
  const [isOnboardedRaw, preferencesRaw, issueStatesRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.isOnboarded),
    AsyncStorage.getItem(STORAGE_KEYS.preferences),
    AsyncStorage.getItem(STORAGE_KEYS.issueStates),
  ]);

  return {
    isOnboarded: isOnboardedRaw === "true",
    preferences: preferencesRaw ? (JSON.parse(preferencesRaw) as UserPreferences) : null,
    issueStates: issueStatesRaw
      ? (JSON.parse(issueStatesRaw) as Record<string, IssueState>)
      : null,
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
