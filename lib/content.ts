import { ContentBundle } from "../types/app";

const REMOTE_CONTENT_URL =
  "https://raw.githubusercontent.com/SAEMMM/stack-pulse/main/content/app-content.json";
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

export async function fetchRemoteContentBundle() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(REMOTE_CONTENT_URL, {
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

export { REMOTE_CONTENT_URL };
