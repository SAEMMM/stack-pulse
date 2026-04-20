import { RemoteUserProfile } from "../types/app";
import { getConfiguredApiBaseUrl } from "./content";

const REMOTE_FETCH_TIMEOUT_MS = 5000;

function isValidRemoteUserProfile(value: unknown): value is RemoteUserProfile {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<RemoteUserProfile>;
  return (
    typeof candidate.userId === "string" &&
    candidate.accountType === "guest" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.isOnboarded === "boolean" &&
    (candidate.preferences === null ||
      (typeof candidate.preferences === "object" && candidate.preferences !== undefined)) &&
    typeof candidate.issueStates === "object" &&
    candidate.issueStates !== null
  );
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRemoteUserProfile(userId: string) {
  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  const url = new URL("/api/me", apiBaseUrl);
  url.searchParams.set("userId", userId);

  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();
      return isValidRemoteUserProfile(payload) ? payload : null;
    });
  } catch {
    return null;
  }
}

export async function syncRemoteUserProfile(profile: RemoteUserProfile) {
  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  const url = new URL("/api/me", apiBaseUrl);

  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
        signal,
      });

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();
      return isValidRemoteUserProfile(payload) ? payload : null;
    });
  } catch {
    return null;
  }
}
