import { useMemo, useState } from "react";
import { generatedIssues } from "../lib/issues";
import { AppTab, Issue, IssueState, UserPreferences } from "../types/app";
import { sortIssues } from "../lib/format";

const defaultPreferences: UserPreferences = {
  role: "frontend",
  stacks: ["React", "Next.js", "TypeScript"],
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
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [states, setStates] = useState<Record<string, IssueState>>(createInitialState);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>("feed");

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
    sortedIssues: visibleIssues,
    setSelectedIssue,
  };
}
