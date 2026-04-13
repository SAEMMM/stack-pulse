import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const rawSourcesPath = path.join(projectRoot, "content", "raw-sources.json");
const outputPath = path.join(projectRoot, "data", "generatedIssues.ts");

const rawSources = JSON.parse(fs.readFileSync(rawSourcesPath, "utf8"));

function unique(items) {
  return [...new Set(items)];
}

function sortByDateDesc(a, b) {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function mergeIssue(group) {
  const latest = [...group].sort(sortByDateDesc)[0];

  const interpretation = {
    en: unique(group.flatMap((item) => item.interpretation.en)),
    ko: unique(group.flatMap((item) => item.interpretation.ko)),
  };

  const action = {
    en: unique(group.flatMap((item) => item.action.en)),
    ko: unique(group.flatMap((item) => item.action.ko)),
  };

  return {
    id: latest.issueKey,
    severity: latest.severity,
    tags: unique(group.flatMap((item) => item.tags)),
    originalTitle: latest.originalTitle,
    summary: latest.summary,
    interpretation,
    action,
    impact: latest.impact,
    sourceCount: group.length,
    sources: group
      .sort(sortByDateDesc)
      .map((item) => ({
        title: item.sourceName,
        url: item.url,
      })),
    publishedAt: latest.publishedAt,
    readTime: `${Math.max(2, interpretation.ko.length)} min`,
  };
}

const grouped = rawSources.reduce((acc, item) => {
  const list = acc.get(item.issueKey) ?? [];
  list.push(item);
  acc.set(item.issueKey, list);
  return acc;
}, new Map());

const issues = [...grouped.values()].map(mergeIssue).sort(sortByDateDesc);

const availableStacks = unique(issues.flatMap((issue) => issue.tags)).sort((a, b) =>
  a.localeCompare(b),
);

const fileContents = `import { Issue } from "../types/app";

export const generatedIssues: Issue[] = ${JSON.stringify(issues, null, 2)};

export const availableStacks = ${JSON.stringify(availableStacks, null, 2)};
`;

fs.writeFileSync(outputPath, fileContents);

console.log(`Generated ${issues.length} issues into data/generatedIssues.ts`);
