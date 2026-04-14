import http from "node:http";
import { spawn } from "node:child_process";
import { openDatabase, getDatabasePath } from "./db.mjs";

const PORT = Number(process.env.STACK_PULSE_API_PORT || 4318);
const HOST = process.env.STACK_PULSE_API_HOST || "0.0.0.0";
let refreshInFlight = null;

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

function runContentRefresh() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/refresh-content.mjs"], {
      cwd: process.cwd(),
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
        resolve({ ok: true, stdout: stdout.trim() });
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

function getContentMeta(db) {
  const row = db.prepare(`SELECT value_json FROM metadata WHERE key = ?`).get("content_meta");
  return row ? JSON.parse(row.value_json) : null;
}

function getAvailableStacks(db) {
  const row = db.prepare(`SELECT value_json FROM metadata WHERE key = ?`).get("available_stacks");
  return row ? JSON.parse(row.value_json) : [];
}

function getFeed(db, stacks) {
  const filters = stacks.filter(Boolean);
  const baseSelect = `
    SELECT DISTINCT issues.payload_json AS payload_json
    FROM issues
    LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
  `;

  let rows;

  if (filters.length > 0) {
    const placeholders = filters.map(() => "?").join(", ");
    rows = db
      .prepare(
        `${baseSelect}
         WHERE issue_tags.tag IN (${placeholders})
         ORDER BY datetime(issues.published_at) DESC`,
      )
      .all(...filters);
  } else {
    rows = db
      .prepare(
        `${baseSelect}
         ORDER BY datetime(issues.published_at) DESC`,
      )
      .all();
  }

  const issues = rows.map((row) => JSON.parse(row.payload_json));
  const contentMeta = getContentMeta(db);

  return {
    issues,
    availableStacks: getAvailableStacks(db),
    contentMeta: contentMeta
      ? {
          ...contentMeta,
          issueCount: issues.length,
        }
      : {
          generatedAt: "",
          issueCount: issues.length,
          sourceCount: 0,
          officialSourceCount: 0,
          fallbackSourceCount: 0,
          lastUpdatedAt: "",
          fetchMode: "db_empty",
          enrichmentMode: "db_empty",
        },
  };
}

function getIssueById(db, issueId) {
  const row = db.prepare(`SELECT payload_json FROM issues WHERE id = ?`).get(issueId);
  return row ? JSON.parse(row.payload_json) : null;
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    notFound(res);
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      dbPath: getDatabasePath(),
      host: HOST,
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    });
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

  let db;

  try {
    db = openDatabase();
  } catch (error) {
    json(res, 500, {
      error: "db_unavailable",
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  try {
    if (req.method === "GET" && url.pathname === "/api/feed") {
      const stacks = (url.searchParams.get("stacks") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      json(res, 200, getFeed(db, stacks));
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/issues/")) {
      const issueId = decodeURIComponent(url.pathname.replace("/api/issues/", ""));
      const issue = getIssueById(db, issueId);

      if (!issue) {
        notFound(res);
        return;
      }

      json(res, 200, issue);
      return;
    }
  } finally {
    db.close();
  }

  notFound(res);
});

server.listen(PORT, HOST, () => {
  console.log(`StackPulse API listening on http://${HOST}:${PORT}`);
});
