import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "content", "fetched-sources.json");
const fixturePath = path.join(projectRoot, "content", "fixtures", "source-snapshot.json");

const sourceDefinitions = [
  {
    key: "nextjs-releases",
    name: "Next.js GitHub Releases",
    sourceType: "release_note",
    mode: "github_releases",
    url: "https://api.github.com/repos/vercel/next.js/releases?per_page=5",
  },
  {
    key: "vercel-blog",
    name: "Vercel Blog",
    sourceType: "blog",
    mode: "rss",
    url: "https://vercel.com/blog/rss.xml",
  },
  {
    key: "github-advisories",
    name: "GitHub Advisory Database",
    sourceType: "security",
    mode: "github_advisories",
    url: "https://api.github.com/advisories?ecosystem=npm&per_page=20",
  },
  {
    key: "react-blog",
    name: "React Blog",
    sourceType: "blog",
    mode: "rss",
    url: "https://react.dev/rss.xml",
  },
];

const issueMatchers = [
  {
    issueKey: "next-16-2",
    severity: "major",
    tags: ["Next.js", "React", "Vercel"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return haystack.includes("next.js 16.2");
    },
  },
  {
    issueKey: "typescript-vuln",
    severity: "security",
    tags: ["TypeScript", "Node.js"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        haystack.includes("typescript") &&
        (haystack.includes("vulnerability") ||
          haystack.includes("advisory") ||
          haystack.includes("supply-chain") ||
          haystack.includes("malware") ||
          haystack.includes("cve-"))
      );
    },
  },
  {
    issueKey: "react-compiler-rfc",
    severity: "breaking",
    tags: ["React"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        haystack.includes("react compiler") &&
        (haystack.includes("rfc") || haystack.includes("escape hatch"))
      );
    },
  },
];

function readFixtureSnapshot() {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return normalizeWhitespace(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"'),
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseXmlEntries(xml) {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)];
  if (itemMatches.length > 0) {
    return itemMatches.map((match) => match[0]);
  }

  return [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)].map((match) => match[0]);
}

function readXmlTag(block, tagNames) {
  for (const tagName of tagNames) {
    const directMatch = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
    if (directMatch) {
      return stripHtml(directMatch[1]);
    }

    const selfClosingMatch = block.match(
      new RegExp(`<${tagName}[^>]*?(?:href|url|term)="([^"]+)"[^>]*/?>`, "i"),
    );
    if (selfClosingMatch) {
      return normalizeWhitespace(selfClosingMatch[1]);
    }
  }

  return "";
}

function parseRssFeed(xml, source) {
  return parseXmlEntries(xml)
    .map((entry) => ({
      sourceKey: source.key,
      sourceName: source.name,
      sourceType: source.sourceType,
      title: readXmlTag(entry, ["title"]),
      excerpt: readXmlTag(entry, ["description", "summary", "content"]),
      url: readXmlTag(entry, ["link", "id"]),
      publishedAt: readXmlTag(entry, ["pubDate", "updated", "published"]),
    }))
    .filter((entry) => entry.title && entry.url);
}

function parseGitHubReleases(items, source) {
  return items
    .filter((item) => !item.draft && !item.prerelease)
    .map((item) => ({
      sourceKey: source.key,
      sourceName: source.name,
      sourceType: source.sourceType,
      title: normalizeWhitespace(item.name || item.tag_name || "Untitled release"),
      excerpt: stripHtml(item.body || ""),
      url: item.html_url,
      publishedAt: item.published_at || item.created_at,
    }));
}

function parseGitHubAdvisories(items, source) {
  return items.map((item) => ({
    sourceKey: source.key,
    sourceName: source.name,
    sourceType: source.sourceType,
    title: normalizeWhitespace(item.summary || item.cve_id || "Untitled advisory"),
    excerpt: stripHtml(item.description || item.summary || ""),
    url: item.html_url || item.references?.[0]?.url || "https://github.com/advisories",
    publishedAt: item.published_at || item.updated_at,
  }));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "StackPulse-MVP-Fetcher",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "StackPulse-MVP-Fetcher",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function collectFromSource(source) {
  if (source.mode === "github_releases") {
    const items = await fetchJson(source.url);
    return parseGitHubReleases(items, source);
  }

  if (source.mode === "github_advisories") {
    const items = await fetchJson(source.url);
    return parseGitHubAdvisories(items, source);
  }

  const xml = await fetchText(source.url);
  return parseRssFeed(xml, source);
}

function matchIssue(entry) {
  return issueMatchers.find((matcher) => matcher.match(entry)) ?? null;
}

function normalizeCollectedEntry(entry) {
  const matchedIssue = matchIssue(entry);

  if (!matchedIssue) {
    return null;
  }

  return {
    sourceId: `${entry.sourceKey}-${slugify(entry.title)}`,
    issueKey: matchedIssue.issueKey,
    sourceType: entry.sourceType,
    sourceName: entry.sourceName,
    url: entry.url,
    publishedAt: entry.publishedAt || new Date().toISOString(),
    severity: matchedIssue.severity,
    tags: matchedIssue.tags,
    originalTitle: entry.title,
    originalExcerpt: entry.excerpt,
    collectedAt: new Date().toISOString(),
  };
}

function mergeWithFixtures(collected, fixtures) {
  const seenKeys = new Set(collected.map((item) => item.issueKey));
  const fallback = fixtures
    .filter((item) => !seenKeys.has(item.issueKey))
    .map((item) => ({
      ...item,
      collectedAt: new Date().toISOString(),
      fallback: true,
    }));

  return [...collected, ...fallback].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

async function fetchLiveSources() {
  const fixtures = readFixtureSnapshot();
  const collectedResults = await Promise.allSettled(
    sourceDefinitions.map(async (source) => {
      const entries = await collectFromSource(source);
      return entries
        .map(normalizeCollectedEntry)
        .filter(Boolean);
    }),
  );

  const successfulEntries = [];

  collectedResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulEntries.push(...result.value);
      return;
    }

    console.warn(`Live fetch failed for ${sourceDefinitions[index].name}.`);
    console.warn(result.reason instanceof Error ? result.reason.message : String(result.reason));
  });

  if (successfulEntries.length === 0) {
    throw new Error("No live sources were collected.");
  }

  return mergeWithFixtures(successfulEntries, fixtures);
}

async function main() {
  const mode = process.env.STACK_PULSE_FETCH_MODE ?? "fixture";
  const fixtureSnapshot = readFixtureSnapshot();

  let sources;

  if (mode === "live") {
    try {
      sources = await fetchLiveSources();
    } catch (error) {
      console.warn("Live fetch failed, falling back to fixture snapshot.");
      console.warn(error instanceof Error ? error.message : String(error));
      sources = fixtureSnapshot;
    }
  } else {
    sources = fixtureSnapshot;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(sources, null, 2)}\n`);

  console.log(
    `Fetched ${sources.length} sources into content/fetched-sources.json using ${mode} mode.`,
  );
  console.log(`Configured sources: ${sourceDefinitions.map((source) => source.name).join(", ")}`);
}

main();
