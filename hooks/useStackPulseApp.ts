import { useEffect, useMemo, useState } from "react";
import { generatedContentMeta, generatedIssues } from "../lib/issues";
import { AppTab, Issue, IssueState, UserPreferences } from "../types/app";
import { sortIssues } from "../lib/format";
import { getNotificationPermissionState } from "../lib/notifications";
import {
  loadPersistedAppState,
  persistIsOnboarded,
  persistIssueStates,
  persistPreferences,
} from "../lib/storage";

const defaultPreferences: UserPreferences = {
  role: "frontend",
  stacks: ["React", "Next.js", "TypeScript"],
  uiLanguage: "ko",
  languageMode: "en_source_ko_all",
  pushLevel: "important_only",
  hideReadIssues: false,
};

function createInitialState(): Record<string, IssueState> {
  return Object.fromEntries(
    generatedIssues.map((issue) => [
      issue.id,
      {
        issueId: issue.id,
        isRead: false,
        isSaved: issue.id === "typescript-vuln",
        isNotified: issue.severity !== "major",
      },
    ]),
  );
}

export function useStackPulseApp() {
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [states, setStates] = useState<Record<string, IssueState>>(createInitialState);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>("feed");

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const persisted = await loadPersistedAppState();
        const notificationPermission = await getNotificationPermissionState();

        if (!isMounted) return;

        if (persisted.preferences) {
          setPreferences({
            ...persisted.preferences,
            notificationPermission,
          });
        } else {
          setPreferences((prev) => ({
            ...prev,
            notificationPermission,
          }));
        }

        if (persisted.issueStates) {
          setStates((prev) => ({ ...prev, ...persisted.issueStates }));
        }

        if (persisted.isOnboarded) {
          setIsOnboarded(true);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistPreferences(preferences);
  }, [isReady, preferences]);

  useEffect(() => {
    if (!isReady) return;
    persistIssueStates(states);
  }, [isReady, states]);

  useEffect(() => {
    if (!isReady) return;
    persistIsOnboarded(isOnboarded);
  }, [isOnboarded, isReady]);

  const sortedIssues = useMemo(
    () => sortIssues(generatedIssues, states, preferences.stacks),
    [preferences.stacks, states],
  );

  const visibleIssues = useMemo(
    () =>
      sortedIssues.filter((issue) => {
        const state = states[issue.id];
        if (preferences.hideReadIssues && state?.isRead) return false;
        return true;
      }),
    [preferences.hideReadIssues, sortedIssues, states],
  );

  const savedIssues = useMemo(
    () => visibleIssues.filter((issue) => states[issue.id]?.isSaved),
    [visibleIssues, states],
  );

  const notifications = useMemo(
    () => visibleIssues.filter((issue) => states[issue.id]?.isNotified),
    [visibleIssues, states],
  );

  function completeOnboarding(next: UserPreferences) {
    setPreferences(next);
    setIsOnboarded(true);
  }

  function openIssue(issue: Issue) {
    setStates((prev) => ({
      ...prev,
      [issue.id]: { ...prev[issue.id], isRead: true },
    }));
    setSelectedIssue(issue);
  }

  function toggleSaved(issueId: string) {
    setStates((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], isSaved: !prev[issueId]?.isSaved },
    }));
  }

  function markUnread(issueId: string) {
    setStates((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], isRead: false },
    }));
  }

  return {
    contentMeta: generatedContentMeta,
    currentTab,
    isReady,
    isOnboarded,
    notifications,
    preferences,
    savedIssues,
    selectedIssue,
    setCurrentTab,
    setPreferences,
    completeOnboarding,
    openIssue,
    toggleSaved,
    markUnread,
    states,
    sortedIssues: visibleIssues,
    setSelectedIssue,
  };
}
