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

    if (!baseline) {
      throw new Error(`Missing baseline enrichment data for issueKey: ${issueKey}`);
    }

    generated[issueKey] = baseline;
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
