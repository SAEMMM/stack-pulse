import { ContentLanguage, Issue, IssueState, LanguageMode, UiLanguage, UserRole } from "../types/app";
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

export function getImpactLabel(issue: Issue) {
  if (issue.impact.level === "high") return "High Impact";
  if (issue.impact.level === "medium") return "Medium Impact";
  return "Low Impact";
}

export function getImpactColors(issue: Issue) {
  if (issue.impact.level === "high") {
    return { bg: colors.impactHighSoft, text: colors.impactHigh };
  }
  if (issue.impact.level === "medium") {
    return { bg: colors.impactMediumSoft, text: colors.impactMedium };
  }
  return { bg: colors.impactLowSoft, text: colors.impactLow };
}

export function getImpactAudiencePreview(issue: Issue) {
  return issue.impact.audience.slice(0, 2).join(" · ");
}

export function getSummaryLanguage(mode: LanguageMode): ContentLanguage {
  if (mode === "full_en" || mode === "en_summary_ko_interpretation") {
    return "en";
  }
  return "ko";
}

export function getDisplayLanguage(mode: LanguageMode): ContentLanguage {
  return mode === "full_en" ? "en" : "ko";
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

export function getDisplayTitle(issue: Issue, mode: LanguageMode) {
  return issue.title[getDisplayLanguage(mode)];
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

export function getRoleLabel(role: UserRole, uiLanguage: UiLanguage) {
  if (uiLanguage !== "en") {
    if (role === "frontend") return "프론트엔드 개발자";
    if (role === "fullstack") return "풀스택 개발자";
    return "테크 리드";
  }

  if (role === "frontend") return "Frontend Developer";
  if (role === "fullstack") return "Fullstack Developer";
  return "Tech Lead";
}

export function getRoleBriefing(role: UserRole, mode: LanguageMode) {
  if (mode === "full_en") {
    if (role === "frontend") {
      return "We prioritize issues that directly affect frontend implementation and framework choices.";
    }
    if (role === "fullstack") {
      return "We prioritize issues that affect both frontend delivery and backend/platform operations.";
    }
    return "We prioritize issues that help with team decisions, upgrades, and technical direction.";
  }

  if (role === "frontend") {
    return "프론트엔드 구현과 프레임워크 변화에 직접 영향을 주는 이슈를 우선 브리핑합니다.";
  }
  if (role === "fullstack") {
    return "프론트와 서버 운영 모두에 파급이 있는 이슈를 우선 브리핑합니다.";
  }
  return "팀 의사결정과 업그레이드 타이밍 판단에 필요한 이슈를 우선 브리핑합니다.";
}

export function getIssueRelevance(
  issue: Issue,
  stacks: string[],
  role: UserRole,
  mode: LanguageMode,
) {
  const matchedStacks = issue.tags.filter((tag) => stacks.includes(tag));

  if (matchedStacks.length > 0) {
    if (mode === "full_en") {
      return `Directly related to your ${matchedStacks.slice(0, 2).join(", ")} stack.`;
    }
    return `${matchedStacks.slice(0, 2).join(", ")} 스택과 직접 연결된 이슈입니다.`;
  }

  if (role === "tech_lead") {
    if (mode === "full_en") {
      return "Shown because it may affect upgrade timing and team-level technical decisions.";
    }
    return "팀 기준과 업그레이드 판단에 영향을 줄 수 있어 리드 관점에서 우선 노출됩니다.";
  }

  if (role === "fullstack") {
    if (mode === "full_en") {
      return "Shown because it may affect the broader product delivery flow beyond your selected stack.";
    }
    return "직접 선택한 스택은 아니지만, 전체 개발 흐름에 영향을 줄 수 있어 함께 노출됩니다.";
  }

  if (mode === "full_en") {
    return "Shown because it is adjacent to key frontend workflows and still worth tracking.";
  }
  return "핵심 프론트엔드 흐름과 인접한 변화라 참고 가치가 있어 노출됩니다.";
}

export function getPrimaryKeyLine(issue: Issue, mode: LanguageMode) {
  const interpretation = getInterpretation(issue, mode);
  const action = getAction(issue, mode);
  const summary = getSummary(issue, mode);
  return interpretation[0] ?? action[0] ?? summary;
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
