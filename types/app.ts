export type LanguageMode =
  | "full_en"
  | "en_source_ko_all"
  | "en_summary_ko_interpretation";

export type ContentLanguage = "en" | "ko";

export type UserRole = "frontend" | "fullstack" | "tech_lead";

export type Severity = "security" | "breaking" | "major";

export type ImpactLevel = "low" | "medium" | "high";

export type AppTab = "feed" | "saved" | "notifications" | "settings";

export type UserPreferences = {
  role: UserRole;
  stacks: string[];
  languageMode: LanguageMode;
  pushLevel: "important_only" | "important_and_major";
  hideReadIssues: boolean;
};

export type Issue = {
  id: string;
  severity: Severity;
  tags: string[];
  originalTitle: string;
  summary: {
    en: string;
    ko: string;
  };
  interpretation: {
    en: string[];
    ko: string[];
  };
  action: {
    en: string[];
    ko: string[];
  };
  impact: {
    level: ImpactLevel;
    audience: string[];
    reason: {
      en: string;
      ko: string;
    };
  };
  sourceCount: number;
  sources: { title: string; url: string }[];
  publishedAt: string;
  readTime: string;
};

export type IssueState = {
  issueId: string;
  isRead: boolean;
  isSaved: boolean;
  isNotified: boolean;
  isDismissed: boolean;
};
