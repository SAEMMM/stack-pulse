import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRemoteUserProfile, syncRemoteUserProfile } from "../lib/account";
import {
  createEmptyContentBundle,
  DEFAULT_STACK_OPTIONS,
  fetchRemoteContentBundle,
  getConfiguredApiBaseUrl,
  triggerRemoteContentRefresh,
} from "../lib/content";
import {
  AppTab,
  ContentBundle,
  ContentSource,
  Issue,
  IssueState,
  RemoteUserProfile,
  UserPreferences,
  UserSession,
} from "../types/app";
import { sortIssues } from "../lib/format";
import { getNotificationPermissionState, scheduleIssueNotification } from "../lib/notifications";
import {
  loadPersistedAppState,
  persistIsOnboarded,
  persistIssueStates,
  persistPreferences,
  persistUserSession,
} from "../lib/storage";

const defaultPreferences: UserPreferences = {
  role: "frontend",
  stacks: ["React", "Next.js", "TypeScript"],
  uiLanguage: "ko",
  languageMode: "en_source_ko_all",
  pushLevel: "important_only",
  hideReadIssues: false,
};

const emptyContentBundle = createEmptyContentBundle();

function createGuestSession(): UserSession {
  return {
    userId: `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    accountType: "guest",
    createdAt: new Date().toISOString(),
  };
}

function resolveContentSource(contentMeta: ContentBundle["contentMeta"]): ContentSource {
  if (contentMeta.issueCount === 0) {
    return "empty";
  }

  if (contentMeta.fetchMode === "fixture") {
    return "fixture";
  }

  if (contentMeta.fetchMode === "live" && contentMeta.fallbackSourceCount > 0) {
    return "mixed";
  }

  return "live";
}

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

function mergeIssueStateRecords(
  localStates?: Record<string, IssueState> | null,
  remoteStates?: Record<string, IssueState> | null,
): Record<string, IssueState> {
  const issueIds = new Set([
    ...Object.keys(localStates ?? {}),
    ...Object.keys(remoteStates ?? {}),
  ]);

  const merged: Record<string, IssueState> = {};

  for (const issueId of issueIds) {
    const local = localStates?.[issueId];
    const remote = remoteStates?.[issueId];

    if (!local && !remote) {
      continue;
    }

    if (!local) {
      merged[issueId] = remote!;
      continue;
    }

    if (!remote) {
      merged[issueId] = local;
      continue;
    }

    merged[issueId] = {
      issueId,
      isRead: local.isRead || remote.isRead,
      isSaved: local.isSaved || remote.isSaved,
      isNotified: local.isNotified || remote.isNotified,
    };
  }

  return merged;
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
  const requestSequenceRef = useRef(0);
  const didHydrateRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [contentBundle, setContentBundle] = useState<ContentBundle>(emptyContentBundle);
  const [contentSource, setContentSource] = useState<ContentSource>("empty");
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const [lastAccountSyncSucceeded, setLastAccountSyncSucceeded] = useState<boolean | null>(null);
  const [lastRefreshSucceeded, setLastRefreshSucceeded] = useState<boolean | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, IssueState>>(() =>
    createInitialState(emptyContentBundle.issues),
  );
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>("feed");

  function applyRemoteBundle(remoteBundle: ContentBundle, cursor: string | null) {
    setContentBundle(remoteBundle);
    setContentSource(resolveContentSource(remoteBundle.contentMeta));
    setNextCursor(cursor);
    setStates((prev) => reconcileIssueStates(remoteBundle.issues, prev));
    setLastRefreshSucceeded(true);

    setSelectedIssue((prev) => {
      if (!prev) return null;
      return remoteBundle.issues.find((issue) => issue.id === prev.id) ?? null;
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const persisted = await loadPersistedAppState();
        const notificationPermission = await getNotificationPermissionState();
        const session = persisted.userSession ?? createGuestSession();
        const remoteProfile = await fetchRemoteUserProfile(session.userId);
        const mergedIssueStates = mergeIssueStateRecords(
          persisted.issueStates,
          remoteProfile?.issueStates,
        );
        const mergedPreferences = remoteProfile?.preferences ?? persisted.preferences;

        if (!isMounted) return;

        setUserSession(session);

        if (mergedPreferences) {
          setPreferences({
            ...mergedPreferences,
            notificationPermission,
          });
        } else {
          setPreferences((prev) => ({
            ...prev,
            notificationPermission,
          }));
        }

        setStates((prev) => ({ ...prev, ...mergedIssueStates }));

        if (remoteProfile) {
          setLastAccountSyncSucceeded(true);
        }

        if (remoteProfile?.isOnboarded || persisted.isOnboarded) {
          setIsOnboarded(true);
        }
      } finally {
        if (isMounted) {
          didHydrateRef.current = true;
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
    const requestId = ++requestSequenceRef.current;

    async function refreshInitialContent() {
      setIsRefreshingContent(true);

      try {
        const remoteFeed = await fetchRemoteContentBundle(preferences.stacks);

        if (!isMounted || requestSequenceRef.current !== requestId) {
          return;
        }

        if (!remoteFeed) {
          setLastRefreshSucceeded(false);
          return;
        }

        applyRemoteBundle(
          {
            issues: remoteFeed.issues,
            availableStacks: remoteFeed.availableStacks,
            contentMeta: remoteFeed.contentMeta,
          },
          remoteFeed.nextCursor ?? null,
        );
      } finally {
        if (isMounted && requestSequenceRef.current === requestId) {
          setIsRefreshingContent(false);
        }
      }
    }

    refreshInitialContent();

    return () => {
      isMounted = false;
    };
  }, [isReady, preferences.stacks]);

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

  useEffect(() => {
    if (!userSession) return;
    persistUserSession(userSession);
  }, [userSession]);

  useEffect(() => {
    if (!isReady || !didHydrateRef.current || !userSession) return;

    const session = userSession;
    let cancelled = false;

    async function syncAccount() {
      setIsSyncingAccount(true);

      const profile: RemoteUserProfile = {
        userId: session.userId,
        accountType: session.accountType,
        createdAt: session.createdAt,
        updatedAt: new Date().toISOString(),
        isOnboarded,
        preferences,
        issueStates: states,
      };

      const syncedProfile = await syncRemoteUserProfile(profile);

      if (cancelled) return;

      setLastAccountSyncSucceeded(Boolean(syncedProfile));
      setIsSyncingAccount(false);
    }

    syncAccount().catch(() => {
      if (!cancelled) {
        setLastAccountSyncSucceeded(false);
        setIsSyncingAccount(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOnboarded, isReady, preferences, states, userSession]);

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
    const requestId = ++requestSequenceRef.current;
    setIsRefreshingContent(true);

    try {
      await triggerRemoteContentRefresh();
      const remoteFeed = await fetchRemoteContentBundle(preferences.stacks);

      if (requestSequenceRef.current !== requestId) {
        return false;
      }

      if (remoteFeed) {
        applyRemoteBundle(
          {
            issues: remoteFeed.issues,
            availableStacks: remoteFeed.availableStacks,
            contentMeta: remoteFeed.contentMeta,
          },
          remoteFeed.nextCursor ?? null,
        );
      } else {
        setLastRefreshSucceeded(false);
      }

      return Boolean(remoteFeed);
    } finally {
      if (requestSequenceRef.current === requestId) {
        setIsRefreshingContent(false);
      }
    }
  }

  async function loadMoreIssues() {
    if (!nextCursor || isLoadingMore) {
      return false;
    }

    setIsLoadingMore(true);

    try {
      const remoteFeed = await fetchRemoteContentBundle(preferences.stacks, nextCursor);

      if (!remoteFeed) {
        return false;
      }

      setContentBundle((prev) => ({
        issues: [
          ...prev.issues,
          ...remoteFeed.issues.filter((issue) => !prev.issues.some((item) => item.id === issue.id)),
        ],
        availableStacks: remoteFeed.availableStacks,
        contentMeta: remoteFeed.contentMeta,
      }));
      setNextCursor(remoteFeed.nextCursor ?? null);
      setContentSource(resolveContentSource(remoteFeed.contentMeta));
      setStates((prev) => reconcileIssueStates(remoteFeed.issues, prev));

      return true;
    } finally {
      setIsLoadingMore(false);
    }
  }

  return {
    availableStacks:
      contentBundle.availableStacks.length > 0
        ? contentBundle.availableStacks
        : [...DEFAULT_STACK_OPTIONS],
    apiBaseUrl: getConfiguredApiBaseUrl(),
    contentMeta: contentBundle.contentMeta,
    contentSource,
    currentTab,
    isReady,
    isOnboarded,
    isLoadingMore,
    isRefreshingContent,
    isSyncingAccount,
    lastAccountSyncSucceeded,
    lastRefreshSucceeded,
    loadMoreIssues,
    nextCursor,
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
    userSession,
  };
}
