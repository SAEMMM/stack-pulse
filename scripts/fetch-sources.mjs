import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "content", "fetched-sources.json");
const fixturePath = path.join(projectRoot, "content", "fixtures", "source-snapshot.json");
const MAX_SOURCE_AGE_DAYS = Number.parseInt(process.env.STACK_PULSE_MAX_SOURCE_AGE_DAYS ?? "180", 10);

const sourceDefinitions = [
  {
    key: "nextjs-releases",
    name: "Next.js GitHub Releases",
    sourceType: "release_note",
    isOfficial: true,
    mode: "github_releases",
    url: "https://api.github.com/repos/vercel/next.js/releases?per_page=5",
  },
  {
    key: "vercel-blog",
    name: "Vercel Blog",
    sourceType: "blog",
    isOfficial: true,
    mode: "rss",
    url: "https://vercel.com/blog/rss.xml",
  },
  {
    key: "github-advisories",
    name: "GitHub Advisory Database",
    sourceType: "security",
    isOfficial: true,
    mode: "github_advisories",
    url: "https://api.github.com/advisories?ecosystem=npm&per_page=20",
  },
  {
    key: "react-blog",
    name: "React Blog",
    sourceType: "blog",
    isOfficial: true,
    mode: "rss",
    url: "https://react.dev/rss.xml",
  },
  {
    key: "typescript-releases",
    name: "TypeScript GitHub Releases",
    sourceType: "release_note",
    isOfficial: true,
    mode: "github_releases",
    url: "https://api.github.com/repos/microsoft/TypeScript/releases?per_page=5",
  },
  {
    key: "nodejs-blog",
    name: "Node.js Blog",
    sourceType: "blog",
    isOfficial: true,
    mode: "rss",
    url: "https://nodejs.org/en/feed/blog.xml",
  },
  {
    key: "nestjs-releases",
    name: "NestJS GitHub Releases",
    sourceType: "release_note",
    isOfficial: true,
    mode: "github_releases",
    url: "https://api.github.com/repos/nestjs/nest/releases?per_page=5",
  },
  {
    key: "prisma-releases",
    name: "Prisma GitHub Releases",
    sourceType: "release_note",
    isOfficial: true,
    mode: "github_releases",
    url: "https://api.github.com/repos/prisma/prisma/releases?per_page=5",
  },
  {
    key: "fastapi-releases",
    name: "FastAPI GitHub Releases",
    sourceType: "release_note",
    isOfficial: true,
    mode: "github_releases",
    url: "https://api.github.com/repos/fastapi/fastapi/releases?per_page=5",
  },
];

const stackKeywords = [
  { stack: "Next.js", keywords: ["next.js", "nextjs", "app router", "turbopack"] },
  { stack: "React", keywords: ["react", "react compiler", "server components"] },
  { stack: "TypeScript", keywords: ["typescript", "tsserver", "tsc"] },
  { stack: "Node.js", keywords: ["node.js", "nodejs", "npm", "package manager"] },
  { stack: "NestJS", keywords: ["nestjs", "guard", "decorator"] },
  { stack: "Prisma", keywords: ["prisma", "query engine", "migrate"] },
  { stack: "FastAPI", keywords: ["fastapi", "pydantic", "uvicorn"] },
  { stack: "Python", keywords: ["python", "pypi", "pip"] },
  { stack: "Database", keywords: ["database", "postgres", "mysql", "sqlite", "sql"] },
  { stack: "Backend", keywords: ["backend", "server", "runtime", "api"] },
  { stack: "Vercel", keywords: ["vercel", "edge", "serverless"] },
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
  {
    issueKey: "typescript-release",
    severity: "major",
    tags: ["TypeScript", "Node.js"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        haystack.includes("typescript") &&
        (haystack.includes("released") ||
          haystack.includes("release") ||
          haystack.includes("beta") ||
          haystack.includes("rc"))
      );
    },
  },
  {
    issueKey: "node-runtime-release",
    severity: "major",
    tags: ["Node.js", "Backend"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        (haystack.includes("node.js") || haystack.includes("nodejs")) &&
        (haystack.includes("release") || haystack.includes("runtime"))
      );
    },
  },
  {
    issueKey: "nestjs-auth-update",
    severity: "major",
    tags: ["NestJS", "Backend", "Node.js"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return haystack.includes("nestjs") && (haystack.includes("auth") || haystack.includes("guard"));
    },
  },
  {
    issueKey: "prisma-query-engine",
    severity: "major",
    tags: ["Prisma", "Database", "Backend"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        haystack.includes("prisma") &&
        (haystack.includes("query engine") ||
          haystack.includes("migrate") ||
          haystack.includes("prisma orm") ||
          haystack.includes("typed sql"))
      );
    },
  },
  {
    issueKey: "fastapi-security-update",
    severity: "security",
    tags: ["FastAPI", "Python", "Backend"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return haystack.includes("fastapi") && (haystack.includes("security") || haystack.includes("vulnerability"));
    },
  },
  {
    issueKey: "react-release",
    severity: "major",
    tags: ["React"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return haystack.includes("react") && (haystack.includes("release") || haystack.includes("react 19"));
    },
  },
  {
    issueKey: "next-runtime-update",
    severity: "major",
    tags: ["Next.js", "React", "Vercel"],
    match(entry) {
      const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
      return (
        (haystack.includes("next.js") || haystack.includes("nextjs")) &&
        !haystack.includes("16.2") &&
        (haystack.includes("release") || haystack.includes("cache") || haystack.includes("router"))
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

function isRecentEnough(publishedAt) {
  const publishedTimestamp = Date.parse(publishedAt);

  if (!Number.isFinite(publishedTimestamp)) {
    return false;
  }

  const maxAgeMs = MAX_SOURCE_AGE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - publishedTimestamp <= maxAgeMs;
}

function getHost(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function toHaystack(entry) {
  return `${entry.sourceName} ${entry.title} ${entry.excerpt} ${entry.url}`.toLowerCase();
}

function inferTags(entry) {
  const haystack = toHaystack(entry);
  const tags = stackKeywords
    .filter((candidate) => candidate.keywords.some((keyword) => haystack.includes(keyword)))
    .map((candidate) => candidate.stack);

  if (tags.length > 0) {
    return tags;
  }

  if (entry.sourceKey.includes("next")) return ["Next.js", "React", "Vercel"];
  if (entry.sourceKey.includes("react")) return ["React"];
  if (entry.sourceKey.includes("typescript")) return ["TypeScript", "Node.js"];
  if (entry.sourceKey.includes("node")) return ["Node.js", "Backend"];
  if (entry.sourceKey.includes("nestjs")) return ["NestJS", "Backend", "Node.js"];
  if (entry.sourceKey.includes("prisma")) return ["Prisma", "Database", "Backend"];
  if (entry.sourceKey.includes("fastapi")) return ["FastAPI", "Python", "Backend"];

  return [];
}

function inferSeverity(entry) {
  const haystack = toHaystack(entry);

  if (
    haystack.includes("cve-") ||
    haystack.includes("security") ||
    haystack.includes("vulnerability") ||
    haystack.includes("advisory") ||
    haystack.includes("supply-chain") ||
    haystack.includes("malware")
  ) {
    return "security";
  }

  if (
    haystack.includes("breaking") ||
    haystack.includes("deprecat") ||
    haystack.includes("migration") ||
    haystack.includes("rfc")
  ) {
    return "breaking";
  }

  return "major";
}

function createGenericIssue(entry) {
  const tags = inferTags(entry);

  if (tags.length === 0) {
    return null;
  }

  return {
    issueKey: `live-${entry.sourceKey}-${slugify(entry.title)}`,
    severity: inferSeverity(entry),
    tags,
  };
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
      isOfficial: source.isOfficial,
      title: readXmlTag(entry, ["title"]),
      excerpt: readXmlTag(entry, ["description", "summary", "content"]),
      url: readXmlTag(entry, ["link", "id"]),
      publishedAt: readXmlTag(entry, ["pubDate", "updated", "published"]),
    }))
    .filter((entry) => entry.title && entry.url && isRecentEnough(entry.publishedAt));
}

function parseGitHubReleases(items, source) {
  return items
    .filter((item) => !item.draft && !item.prerelease)
    .map((item) => ({
      sourceKey: source.key,
      sourceName: source.name,
      sourceType: source.sourceType,
      isOfficial: source.isOfficial,
      title: normalizeWhitespace(item.name || item.tag_name || "Untitled release"),
      excerpt: stripHtml(item.body || ""),
      url: item.html_url,
      publishedAt: item.published_at || item.created_at,
    }))
    .filter((item) => isRecentEnough(item.publishedAt));
}

function parseGitHubAdvisories(items, source) {
  return items
    .map((item) => ({
      sourceKey: source.key,
      sourceName: source.name,
      sourceType: source.sourceType,
      isOfficial: source.isOfficial,
      title: normalizeWhitespace(item.summary || item.cve_id || "Untitled advisory"),
      excerpt: stripHtml(item.description || item.summary || ""),
      url: item.html_url || item.references?.[0]?.url || "https://github.com/advisories",
      publishedAt: item.published_at || item.updated_at,
    }))
    .filter((item) => isRecentEnough(item.publishedAt));
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
  return issueMatchers.find((matcher) => matcher.match(entry)) ?? createGenericIssue(entry);
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
    host: getHost(entry.url),
    isOfficial: entry.isOfficial ?? false,
    publishedAt: entry.publishedAt || new Date().toISOString(),
    severity: matchedIssue.severity,
    tags: matchedIssue.tags,
    originalTitle: entry.title,
    originalExcerpt: entry.excerpt,
    collectedAt: new Date().toISOString(),
  };
}

function normalizeFixtureEntry(entry) {
  if (!isRecentEnough(entry.publishedAt)) {
    return null;
  }

  return {
    ...entry,
    host: entry.host ?? getHost(entry.url),
    isOfficial: entry.isOfficial ?? true,
    collectedAt: entry.collectedAt ?? new Date().toISOString(),
  };
}

function mergeWithFixtures(collected, fixtures) {
  const seenKeys = new Set(collected.map((item) => item.issueKey));
  const fallback = fixtures
    .map((item) => normalizeFixtureEntry(item))
    .filter(Boolean)
    .filter((item) => !seenKeys.has(item.issueKey))
    .map((item) => ({
      ...item,
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
  const mode = process.env.STACK_PULSE_FETCH_MODE ?? "live";
  const fixtureSnapshot = readFixtureSnapshot()
    .map((item) => normalizeFixtureEntry(item))
    .filter(Boolean);

  let sources;

  if (mode === "live") {
    try {
      sources = await fetchLiveSources();
    } catch (error) {
      console.warn("Live fetch failed, falling back to fixture snapshot.");
      console.warn(error instanceof Error ? error.message : String(error));
      sources = fixtureSnapshot.map((item) => ({
        ...normalizeFixtureEntry(item),
        fallback: true,
      }));
    }
  } else {
    sources = fixtureSnapshot.map((item) => ({
      ...item,
      fallback: true,
    }));
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(sources, null, 2)}\n`);

  console.log(
    `Fetched ${sources.length} sources into content/fetched-sources.json using ${mode} mode.`,
  );
  console.log(`Excluded sources older than ${MAX_SOURCE_AGE_DAYS} days.`);
  console.log(`Configured sources: ${sourceDefinitions.map((source) => source.name).join(", ")}`);
}

main();
