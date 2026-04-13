import { useMemo, useState } from "react";
import { mockIssues } from "../data/mockIssues";
import { AppTab, Issue, IssueState, UserPreferences } from "../types/app";
import { sortIssues } from "../lib/format";

const defaultPreferences: UserPreferences = {
  role: "frontend",
  stacks: ["React", "Next.js", "TypeScript"],
  languageMode: "en_source_ko_all",
  pushLevel: "important_only",
};

function createInitialState(): Record<string, IssueState> {
  return Object.fromEntries(
    mockIssues.map((issue) => [
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
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [states, setStates] = useState<Record<string, IssueState>>(createInitialState);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>("feed");

  const sortedIssues = useMemo(
    () => sortIssues(mockIssues, states, preferences.stacks),
    [preferences.stacks, states],
  );

  const savedIssues = useMemo(
    () => sortedIssues.filter((issue) => states[issue.id]?.isSaved),
    [sortedIssues, states],
  );

  const notifications = useMemo(
    () => sortedIssues.filter((issue) => states[issue.id]?.isNotified),
    [sortedIssues, states],
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
    currentTab,
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
    sortedIssues,
    setSelectedIssue,
  };
}
