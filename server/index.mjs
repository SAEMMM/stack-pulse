import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.STACK_PULSE_API_PORT || 4318);
const projectRoot = process.cwd();
const contentPath = path.join(projectRoot, "content", "app-content.json");
let refreshInFlight = null;

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

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
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

function runContentRefresh() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/refresh-content.mjs"], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      refreshInFlight = null;

      if (code === 0) {
        resolve({
          ok: true,
          stdout: stdout.trim(),
        });
        return;
      }

      reject(
        new Error(
          stderr.trim() || stdout.trim() || `refresh failed with exit code ${String(code)}`,
        ),
      );
    });
  });

  return refreshInFlight;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    notFound(res);
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/refresh") {
    try {
      await readRequestBody(req);
      const result = await runContentRefresh();
      json(res, 200, result);
    } catch (error) {
      json(res, 500, {
        ok: false,
        error: "refresh_failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
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
