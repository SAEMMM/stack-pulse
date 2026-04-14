import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const fetchedSourcesPath = path.join(projectRoot, "content", "fetched-sources.json");
const generatedEnrichmentsPath = path.join(projectRoot, "content", "generated-enrichments.json");
const baselineEnrichmentsPath = path.join(projectRoot, "content", "issue-enrichments.json");
const outputPath = path.join(projectRoot, "data", "generatedIssues.ts");

const fetchedSources = JSON.parse(fs.readFileSync(fetchedSourcesPath, "utf8"));
const enrichmentsPath = fs.existsSync(generatedEnrichmentsPath)
  ? generatedEnrichmentsPath
  : baselineEnrichmentsPath;
const enrichments = JSON.parse(fs.readFileSync(enrichmentsPath, "utf8"));

function unique(items) {
  return [...new Set(items)];
}

function sortByDateDesc(a, b) {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function dedupeSources(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.url || `${item.sourceName}-${item.originalTitle}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mergeIssue(group) {
  const latest = [...group].sort(sortByDateDesc)[0];
  const enrichment = enrichments[latest.issueKey];

  if (!enrichment) {
    throw new Error(`Missing enrichment data for issueKey: ${latest.issueKey}`);
  }

  const interpretation = enrichment.interpretation;
  const action = enrichment.action;

  return {
    id: latest.issueKey,
    severity: latest.severity,
    tags: unique(group.flatMap((item) => item.tags)),
    originalTitle: latest.originalTitle,
    title: enrichment.title,
    summary: enrichment.summary,
    interpretation,
    action,
    impact: enrichment.impact,
    sourceCount: group.length,
    sources: dedupeSources(group)
      .sort(sortByDateDesc)
      .map((item) => ({
        title: item.sourceName,
        url: item.url,
        type: item.sourceType,
        host: item.host ?? "",
        isOfficial: item.isOfficial ?? false,
        publishedAt: item.publishedAt,
      })),
    publishedAt: latest.publishedAt,
    readTime: `${Math.max(2, interpretation.ko.length)} min`,
  };
}

const grouped = fetchedSources.reduce((acc, item) => {
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
