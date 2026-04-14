import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const PORT = Number(process.env.STACK_PULSE_API_PORT || 4318);
const projectRoot = process.cwd();
const contentPath = path.join(projectRoot, "content", "app-content.json");

function readContentBundle() {
  const raw = fs.readFileSync(contentPath, "utf8");
  return JSON.parse(raw);
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  json(res, 404, { error: "not_found" });
}

function sortIssuesByLatest(issues) {
  return [...issues].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function filterIssuesByStacks(issues, stacks) {
  if (stacks.length === 0) {
    return sortIssuesByLatest(issues);
  }

  const matched = issues.filter((issue) => issue.tags.some((tag) => stacks.includes(tag)));
  return sortIssuesByLatest(matched);
}

function buildFeed(bundle, stacks) {
  const issues = filterIssuesByStacks(bundle.issues, stacks);

  return {
    issues,
    availableStacks: bundle.availableStacks,
    contentMeta: {
      ...bundle.contentMeta,
      issueCount: issues.length,
    },
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    notFound(res);
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  let bundle;

  try {
    bundle = readContentBundle();
  } catch (error) {
    json(res, 500, {
      error: "content_unavailable",
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/feed") {
    const stacks = (url.searchParams.get("stacks") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    json(res, 200, buildFeed(bundle, stacks));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/issues/")) {
    const issueId = decodeURIComponent(url.pathname.replace("/api/issues/", ""));
    const issue = bundle.issues.find((item) => item.id === issueId);

    if (!issue) {
      notFound(res);
      return;
    }

    json(res, 200, issue);
    return;
  }

  notFound(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`StackPulse API listening on http://127.0.0.1:${PORT}`);
});
