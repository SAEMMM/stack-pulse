import { ContentBundle } from "../types/app";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:4318";
const REMOTE_FETCH_TIMEOUT_MS = 5000;

export const DEFAULT_STACK_OPTIONS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "NestJS",
  "Prisma",
  "FastAPI",
  "Python",
  "Backend",
  "Database",
  "Vercel",
] as const;

export function createEmptyContentBundle(): ContentBundle {
  return {
    issues: [],
    availableStacks: [...DEFAULT_STACK_OPTIONS],
    contentMeta: {
      generatedAt: "",
      issueCount: 0,
      sourceCount: 0,
      officialSourceCount: 0,
      fallbackSourceCount: 0,
      lastUpdatedAt: "",
      fetchMode: "remote_only",
      enrichmentMode: "remote_only",
    },
  };
}

function isValidBundle(value: unknown): value is ContentBundle {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ContentBundle>;
  return (
    Array.isArray(candidate.issues) &&
    Array.isArray(candidate.availableStacks) &&
    typeof candidate.contentMeta?.issueCount === "number" &&
    typeof candidate.contentMeta?.sourceCount === "number"
  );
}

function getApiBaseUrl() {
  const extra =
    typeof process !== "undefined" ? (process.env.EXPO_PUBLIC_STACK_PULSE_API_URL ?? "") : "";
  return extra || DEFAULT_API_BASE_URL;
}

export async function triggerRemoteContentRefresh() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
  const url = new URL("/api/refresh", getApiBaseUrl());

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRemoteContentBundle(stacks: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
  const url = new URL("/api/feed", getApiBaseUrl());

  if (stacks.length > 0) {
    url.searchParams.set("stacks", stacks.join(","));
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();

    if (!isValidBundle(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export { DEFAULT_API_BASE_URL };
