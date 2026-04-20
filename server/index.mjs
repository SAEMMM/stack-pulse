import http from "node:http";
import { spawn } from "node:child_process";
import { createStore, getStoreInfo } from "./store.mjs";

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

function badRequest(res, message) {
  json(res, 400, { error: "bad_request", message });
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
    const storeInfo = getStoreInfo();
    json(res, 200, {
      ok: true,
      database: storeInfo,
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

  let store;

  try {
    store = await createStore();
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
      const cursor = url.searchParams.get("cursor");
      const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10);

      json(res, 200, await store.getFeed(stacks, cursor, limit));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      const userId = url.searchParams.get("userId")?.trim();

      if (!userId) {
        badRequest(res, "userId is required");
        return;
      }

      json(res, 200, await store.getUserProfile(userId));
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/me") {
      const rawBody = await readRequestBody(req);
      let payload = null;

      try {
        payload = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        badRequest(res, "request body must be valid JSON");
        return;
      }

      if (!payload?.userId || typeof payload.userId !== "string") {
        badRequest(res, "userId is required");
        return;
      }

      json(res, 200, await store.syncUserProfile(payload));
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/issues/")) {
      const issueId = decodeURIComponent(url.pathname.replace("/api/issues/", ""));
      const issue = await store.getIssueById(issueId);

      if (!issue) {
        notFound(res);
        return;
      }

      json(res, 200, issue);
      return;
    }
  } finally {
    await store.close();
  }

  notFound(res);
});

server.listen(PORT, HOST, () => {
  console.log(`StackPulse API listening on http://${HOST}:${PORT}`);
});
