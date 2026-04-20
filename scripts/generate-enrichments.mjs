import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const fetchedSourcesPath = path.join(projectRoot, "content", "fetched-sources.json");
const baselineEnrichmentsPath = path.join(projectRoot, "content", "issue-enrichments.json");
const outputPath = path.join(projectRoot, "content", "generated-enrichments.json");

const fetchedSources = JSON.parse(fs.readFileSync(fetchedSourcesPath, "utf8"));
const baselineEnrichments = JSON.parse(fs.readFileSync(baselineEnrichmentsPath, "utf8"));

function sortByDateDesc(a, b) {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function groupByIssue(items) {
  return items.reduce((acc, item) => {
    const list = acc.get(item.issueKey) ?? [];
    list.push(item);
    acc.set(item.issueKey, list);
    return acc;
  }, new Map());
}

function formatTags(group) {
  return [...new Set(group.flatMap((item) => item.tags ?? []))];
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdown(value) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*_>#-]/g, " ")
      .replace(/\bPR\s*\[#?\d+\]/gi, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^\S\r\n]+/g, " "),
  );
}

function truncate(value, maxLength = 180) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function extractVersion(title) {
  const match = String(title || "").match(/\b\d+\.\d+(?:\.\d+)*(?:[a-z]+\d*)?\b/i);
  return match?.[0] ?? null;
}

function isVersionOnlyTitle(title) {
  const normalized = normalizeWhitespace(String(title || ""));
  return Boolean(normalized) && normalized === (extractVersion(normalized) ?? "");
}

function detectThemes(text) {
  const haystack = text.toLowerCase();
  const themes = [];

  if (haystack.includes("security") || haystack.includes("vulnerability") || haystack.includes("cve")) {
    themes.push({ en: "security fixes", ko: "보안 수정" });
  }
  if (haystack.includes("free-threaded") || haystack.includes("python 3.14")) {
    themes.push({ en: "Python runtime support", ko: "Python 런타임 지원" });
  }
  if (haystack.includes("feature") || haystack.includes("support")) {
    themes.push({ en: "feature additions", ko: "기능 추가" });
  }
  if (haystack.includes("fix") || haystack.includes("bug")) {
    themes.push({ en: "bug fixes", ko: "버그 수정" });
  }
  if (haystack.includes("upgrade") || haystack.includes("bump")) {
    themes.push({ en: "dependency upgrades", ko: "의존성 업그레이드" });
  }
  if (haystack.includes("refactor")) {
    themes.push({ en: "internal refactors", ko: "내부 리팩터링" });
  }
  if (haystack.includes("docs") || haystack.includes("documentation")) {
    themes.push({ en: "documentation updates", ko: "문서 업데이트" });
  }

  return themes.slice(0, 2);
}

function buildGenericTitle(latest, primaryTag, tags) {
  const version = extractVersion(latest.originalTitle);
  const readableVersion = version ? ` ${version}` : "";
  const sourceLabel = tags[0] ?? primaryTag;

  if (latest.severity === "security") {
    return {
      en: `${sourceLabel}${readableVersion} security update needs review`,
      ko: `${sourceLabel}${readableVersion} 보안 업데이트 검토가 필요합니다`,
    };
  }

  if (isVersionOnlyTitle(latest.originalTitle)) {
    return {
      en: `${sourceLabel}${readableVersion} release is worth reviewing`,
      ko: `${sourceLabel}${readableVersion} 릴리스를 검토할 가치가 있습니다`,
    };
  }

  return {
    en: truncate(stripMarkdown(latest.originalTitle), 72),
    ko: `${sourceLabel} 관련 업데이트를 검토할 가치가 있습니다`,
  };
}

function buildGenericSummary(latest, primaryTag, sourceNames, tags) {
  const cleanedExcerpt = stripMarkdown(latest.originalExcerpt || "");
  const version = extractVersion(latest.originalTitle);
  const themes = detectThemes(`${latest.originalTitle} ${latest.originalExcerpt}`);
  const themeEn = themes.map((item) => item.en).join(" and ");
  const themeKo = themes.map((item) => item.ko).join(", ");
  const sourceLabel = tags[0] ?? primaryTag;

  if (latest.severity === "security") {
    return {
      en: truncate(
        cleanedExcerpt || `${sourceLabel} update from ${sourceNames} appears security-related and should be checked against your stack.`,
      ),
      ko: `${sourceLabel} 관련 항목에서 보안 성격의 업데이트가 감지되었습니다. 현재 사용 중인 버전과 영향 범위를 우선 확인하세요.`,
    };
  }

  if (version) {
    return {
      en: truncate(
        cleanedExcerpt || `${sourceLabel} ${version} includes ${themeEn || "changes worth reviewing"} from ${sourceNames}.`,
      ),
      ko: `${sourceLabel} ${version} 릴리스에 ${themeKo || "검토할 변경 사항"}이 포함됐습니다.`,
    };
  }

  if (cleanedExcerpt) {
    return {
      en: truncate(cleanedExcerpt),
      ko: `${sourceLabel} 관련 업데이트가 감지되었습니다. ${themeKo || "주요 변경 사항"} 중심으로 검토해 보세요.`,
    };
  }

  return {
    en: `${sourceLabel} update collected from ${sourceNames}.`,
    ko: `${sourceNames}에서 ${sourceLabel} 관련 업데이트를 수집했습니다.`,
  };
}

function buildGenericEnrichment(issueKey, group) {
  const ordered = [...group].sort(sortByDateDesc);
  const latest = ordered[0];
  const tags = formatTags(group);
  const primaryTag = tags[0] ?? "developer tooling";
  const sourceNames = [...new Set(group.map((item) => item.sourceName))].slice(0, 2).join(" + ");
  const severity = latest.severity ?? "major";
  const isSecurity = severity === "security";
  const isBreaking = severity === "breaking";
  const title = buildGenericTitle(latest, primaryTag, tags);
  const summary = buildGenericSummary(latest, primaryTag, sourceNames, tags);

  return {
    title,
    summary,
    interpretation: {
      en: [
        `This item was collected from live sources and tagged for ${tags.join(", ") || primaryTag}.`,
        isSecurity
          ? "Treat this as a same-day review item if the affected dependency or runtime is in your stack."
          : isBreaking
            ? "Review upgrade notes before rollout because behavior or migration expectations may have shifted."
            : "This looks review-worthy, but teams should validate relevance against their current stack before acting.",
      ],
      ko: [
        `라이브 소스에서 수집된 항목이며 ${tags.join(", ") || primaryTag} 관점으로 분류되었습니다.`,
        isSecurity
          ? "영향 기술을 사용 중이면 당일 검토 항목으로 보는 편이 안전합니다."
          : isBreaking
            ? "동작 방식이나 마이그레이션 기대치가 바뀌었을 수 있으니 배포 전에 릴리즈 노트를 확인하세요."
            : "검토 가치는 있지만, 실제 대응 전에는 현재 팀 스택과의 관련성을 먼저 확인하는 편이 좋습니다.",
      ],
    },
    action: {
      en: [
        "Open the original sources and confirm whether the affected version range or feature area matches your stack.",
        isSecurity ? "Prioritize patch planning if exposed services or CI pipelines are involved." : "Schedule validation in a branch or staging environment before broad rollout.",
      ],
      ko: [
        "원문 링크를 열어 영향 버전과 기능 범위가 현재 스택과 맞는지 먼저 확인하세요.",
        isSecurity ? "외부 노출 서비스나 CI에 연결되면 패치 계획을 우선 잡으세요." : "전사 반영 전 브랜치나 스테이징에서 먼저 검증하세요.",
      ],
    },
    impact: {
      level: isSecurity ? "high" : "medium",
      audience: tags.length > 0 ? tags : [primaryTag],
      reason: {
        en: `This was auto-generated from live source matches for ${tags.join(", ") || primaryTag}.`,
        ko: `${tags.join(", ") || primaryTag} 관련 라이브 소스 매칭을 바탕으로 자동 생성된 브리프입니다.`,
      },
    },
  };
}

function buildPrompt(issueKey, group) {
  const ordered = [...group].sort(sortByDateDesc);
  const latest = ordered[0];

  return [
    "You are generating structured issue intelligence for StackPulse, a developer decision-support app.",
    "Return strict JSON with this shape only:",
    JSON.stringify({
      title: { en: "", ko: "" },
      summary: { en: "", ko: "" },
      interpretation: { en: ["", ""], ko: ["", ""] },
      action: { en: ["", ""], ko: ["", ""] },
      impact: {
        level: "low | medium | high",
        audience: ["", ""],
        reason: { en: "", ko: "" },
      },
    }),
    "Requirements:",
    "- Focus on developer decision support, not generic news tone.",
    "- Keep titles clickable and specific.",
    "- Interpretation should explain why this matters to developers.",
    "- Action should be practical and conservative.",
    "- Korean should read naturally for Korean developers.",
    "",
    `Issue key: ${issueKey}`,
    `Latest title: ${latest.originalTitle}`,
    `Severity: ${latest.severity}`,
    `Tags: ${latest.tags.join(", ")}`,
    "Source bundle:",
    ...ordered.map((item, index) =>
      `${index + 1}. [${item.sourceName}] ${item.originalTitle}\nURL: ${item.url}\nExcerpt: ${item.originalExcerpt}`,
    ),
  ].join("\n");
}

async function generateWithOpenAI(issueKey, group) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.STACK_PULSE_OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for openai enrichment mode.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: buildPrompt(issueKey, group),
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const text =
    payload.output_text ??
    payload.output?.[0]?.content?.find((item) => item.type === "output_text")?.text;

  if (!text) {
    throw new Error(`OpenAI response did not include output_text for ${issueKey}`);
  }

  return JSON.parse(text);
}

async function generateEnrichments(mode) {
  const grouped = groupByIssue(fetchedSources);
  const generated = {};

  for (const [issueKey, group] of grouped.entries()) {
    if (mode === "openai") {
      try {
        generated[issueKey] = await generateWithOpenAI(issueKey, group);
        continue;
      } catch (error) {
        console.warn(`OpenAI enrichment failed for ${issueKey}. Falling back to baseline data.`);
        console.warn(error instanceof Error ? error.message : String(error));
      }
    }

    const baseline = baselineEnrichments[issueKey];

    generated[issueKey] = baseline ?? buildGenericEnrichment(issueKey, group);
  }

  return generated;
}

async function main() {
  const mode = process.env.STACK_PULSE_ENRICHMENT_MODE ?? "baseline";
  const enrichments = await generateEnrichments(mode);

  fs.writeFileSync(outputPath, `${JSON.stringify(enrichments, null, 2)}\n`);

  console.log(
    `Generated ${Object.keys(enrichments).length} enrichments into content/generated-enrichments.json using ${mode} mode.`,
  );
}

main();
