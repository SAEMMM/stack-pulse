import { useEffect, useMemo, useState } from "react";
import { fetchRemoteContentBundle, getLocalContentBundle } from "../lib/content";
import { AppTab, ContentBundle, ContentSource, Issue, IssueState, UserPreferences } from "../types/app";
import { sortIssues } from "../lib/format";
import { getNotificationPermissionState, scheduleIssueNotification } from "../lib/notifications";
import {
  loadPersistedAppState,
  persistContentBundle,
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

const localContentBundle = getLocalContentBundle();

function createStateForIssue(issue: Issue): IssueState {
  return {
    issueId: issue.id,
    isRead: false,
    isSaved: issue.id === "typescript-vuln",
    isNotified: false,
  };
}

function createInitialState(issues: Issue[]): Record<string, IssueState> {
  return Object.fromEntries(
    issues.map((issue) => [
      issue.id,
      createStateForIssue(issue),
    ]),
  );
}

function reconcileIssueStates(
  issues: Issue[],
  existing?: Record<string, IssueState> | null,
): Record<string, IssueState> {
  return Object.fromEntries(
    issues.map((issue) => [issue.id, existing?.[issue.id] ?? createStateForIssue(issue)]),
  );
}

export function useStackPulseApp() {
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [contentBundle, setContentBundle] = useState<ContentBundle>(localContentBundle);
  const [contentSource, setContentSource] = useState<ContentSource>("bundled");
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [states, setStates] = useState<Record<string, IssueState>>(() =>
    createInitialState(localContentBundle.issues),
  );
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>("feed");

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const persisted = await loadPersistedAppState();
        const notificationPermission = await getNotificationPermissionState();

        if (!isMounted) return;

        const initialBundle = persisted.contentBundle ?? localContentBundle;

        if (persisted.contentBundle) {
          setContentBundle(persisted.contentBundle);
          setContentSource("cached");
        }

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

        setStates(reconcileIssueStates(initialBundle.issues, persisted.issueStates));

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

    let isMounted = true;

    async function refreshInitialContent() {
      setIsRefreshingContent(true);
      const remoteBundle = await fetchRemoteContentBundle();

      if (!remoteBundle || !isMounted) {
        setIsRefreshingContent(false);
        return;
      }

      setContentBundle(remoteBundle);
      setContentSource("remote");
      setStates((prev) => reconcileIssueStates(remoteBundle.issues, prev));
      await persistContentBundle(remoteBundle);

      setSelectedIssue((prev) => {
        if (!prev) return null;
        return remoteBundle.issues.find((issue) => issue.id === prev.id) ?? null;
      });

      if (isMounted) {
        setIsRefreshingContent(false);
      }
    }

    refreshInitialContent();

    return () => {
      isMounted = false;
    };
  }, [isReady]);

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
    () => sortIssues(contentBundle.issues, states, preferences.stacks),
    [contentBundle.issues, preferences.stacks, states],
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

  useEffect(() => {
    if (!isReady || !isOnboarded) return;
    if (preferences.notificationPermission !== "granted") return;

    const candidate = visibleIssues.find((issue) => {
      const alreadyNotified = states[issue.id]?.isNotified;
      if (alreadyNotified) return false;

      if (preferences.pushLevel === "important_only") {
        return issue.severity === "security" || issue.severity === "breaking";
      }

      return true;
    });

    if (!candidate) return;

    const notificationIssue = candidate;

    let cancelled = false;

    async function notify() {
      await scheduleIssueNotification(notificationIssue, preferences.languageMode);

      if (cancelled) return;

      setStates((prev) => ({
        ...prev,
        [notificationIssue.id]: {
          ...prev[notificationIssue.id],
          isNotified: true,
        },
      }));
    }

    notify();

    return () => {
      cancelled = true;
    };
  }, [
    isOnboarded,
    isReady,
    preferences.languageMode,
    preferences.notificationPermission,
    preferences.pushLevel,
    states,
    visibleIssues,
  ]);

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

  async function refreshContent() {
    setIsRefreshingContent(true);
    const remoteBundle = await fetchRemoteContentBundle();

    if (remoteBundle) {
      setContentBundle(remoteBundle);
      setContentSource("remote");
      setStates((prev) => reconcileIssueStates(remoteBundle.issues, prev));
      await persistContentBundle(remoteBundle);

      setSelectedIssue((prev) => {
        if (!prev) return null;
        return remoteBundle.issues.find((issue) => issue.id === prev.id) ?? null;
      });
    }

    setIsRefreshingContent(false);
    return Boolean(remoteBundle);
  }

  return {
    availableStacks: contentBundle.availableStacks,
    contentMeta: contentBundle.contentMeta,
    contentSource,
    currentTab,
    isReady,
    isOnboarded,
    isRefreshingContent,
    notifications,
    preferences,
    refreshContent,
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
