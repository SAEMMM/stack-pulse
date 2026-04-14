import { ContentBundle } from "../types/app";
import { localContentBundle } from "./issues";

const REMOTE_CONTENT_URL =
  "https://raw.githubusercontent.com/SAEMMM/stack-pulse/main/content/app-content.json";

function isValidBundle(value: unknown): value is ContentBundle {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ContentBundle>;
  return (
    Array.isArray(candidate.issues) &&
    Array.isArray(candidate.availableStacks) &&
    typeof candidate.contentMeta?.lastUpdatedAt === "string" &&
    typeof candidate.contentMeta?.issueCount === "number"
  );
}

export function getLocalContentBundle() {
  return localContentBundle;
}

export async function fetchRemoteContentBundle() {
  try {
    const response = await fetch(REMOTE_CONTENT_URL, {
      headers: {
        Accept: "application/json",
      },
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
  }
}

export { REMOTE_CONTENT_URL };
