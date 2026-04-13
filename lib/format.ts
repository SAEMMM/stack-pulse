import { ContentLanguage, Issue, IssueState, LanguageMode } from "../types/app";
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

export function getSummaryLanguage(mode: LanguageMode): ContentLanguage {
  if (mode === "full_en" || mode === "en_summary_ko_interpretation") {
    return "en";
  }
  return "ko";
}

export function getInterpretationLanguage(mode: LanguageMode): ContentLanguage {
  return mode === "full_en" ? "en" : "ko";
}

export function getActionLanguage(mode: LanguageMode): ContentLanguage {
  return mode === "full_en" ? "en" : "ko";
}

export function getSummary(issue: Issue, mode: LanguageMode) {
  const language = getSummaryLanguage(mode);
  return issue.summary[language];
}

export function getInterpretation(issue: Issue, mode: LanguageMode) {
  const language = getInterpretationLanguage(mode);
  return issue.interpretation[language];
}

export function getAction(issue: Issue, mode: LanguageMode) {
  const language = getActionLanguage(mode);
  return issue.action[language];
}

export function getImpactReason(issue: Issue, mode: LanguageMode) {
  const language = getActionLanguage(mode);
  return issue.impact.reason[language];
}

export function getLanguageLabel(language: ContentLanguage) {
  return language.toUpperCase();
}

export function getLanguageModePreview(mode: LanguageMode) {
  const summary = getLanguageLabel(getSummaryLanguage(mode));
  const interpretation = getLanguageLabel(getInterpretationLanguage(mode));
  return `Original EN · Summary ${summary} · Interpretation ${interpretation}`;
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
