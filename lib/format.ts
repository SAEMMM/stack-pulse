import { Issue, IssueState, LanguageMode } from "../types/app";
import { colors } from "../constants/theme";

export function getSeverityLabel(issue: Issue) {
  if (issue.severity === "security") return "Security";
  if (issue.severity === "breaking") return "Breaking";
  return "Major";
}

export function getSeverityColors(issue: Issue) {
  if (issue.severity === "security") {
    return { bg: colors.securitySoft, text: colors.security };
  }
  if (issue.severity === "breaking") {
    return { bg: colors.breakingSoft, text: colors.breaking };
  }
  return { bg: colors.majorSoft, text: colors.major };
}

export function getSummary(issue: Issue, mode: LanguageMode) {
  return mode === "full_en" ? issue.summary.en : issue.summary.ko;
}

export function getInterpretation(issue: Issue, mode: LanguageMode) {
  return mode === "full_en" ? issue.interpretation.en : issue.interpretation.ko;
}

export function getAction(issue: Issue, mode: LanguageMode) {
  return mode === "full_en" ? issue.action.en : issue.action.ko;
}

export function getImpactReason(issue: Issue, mode: LanguageMode) {
  return mode === "full_en" ? issue.impact.reason.en : issue.impact.reason.ko;
}

export function sortIssues(issues: Issue[], states: Record<string, IssueState>, stacks: string[]) {
  return [...issues].sort((a, b) => {
    const severityScore = { security: 3, breaking: 2, major: 1 };
    const aRel = a.tags.some((tag) => stacks.includes(tag)) ? 1 : 0;
    const bRel = b.tags.some((tag) => stacks.includes(tag)) ? 1 : 0;
    const aRead = states[a.id]?.isRead ? 0 : 1;
    const bRead = states[b.id]?.isRead ? 0 : 1;
    return (
      bRel - aRel ||
      severityScore[b.severity] - severityScore[a.severity] ||
      bRead - aRead ||
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
    );
  });
}
