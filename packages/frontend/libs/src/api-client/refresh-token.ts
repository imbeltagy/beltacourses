import { extractError } from "./helpers";

type RefreshResult =
  | { success: true }
  | { success: false; status: number; error: string; message: string };

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

// Concurrent 401/403s all await this same in-flight refresh instead of each
// firing their own request against /auth/refresh.
let refreshPromise: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  const refreshToken = "dump-string";
  if (!refreshToken) {
    return {
      success: false,
      status: 401,
      error: "NO_REFRESH_TOKEN",
      message: SESSION_EXPIRED_MESSAGE,
    };
  }

  const res = await fetch(`/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  let payload: unknown;
  try {
    payload = isJson ? await res.json() : await res.text();
  } catch {
    payload = undefined;
  }

  if (!res.ok) {
    const extracted = extractError(payload);
    return {
      success: false,
      status: res.status,
      error: extracted?.error ?? "REFRESH_FAILED",
      message: extracted?.message ?? SESSION_EXPIRED_MESSAGE,
    };
  }

  return { success: true };
}

export function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .catch(
        (): RefreshResult => ({
          success: false,
          status: 0,
          error: "NETWORK_ERROR",
          message:
            "We couldn't reach the server to refresh your session. Please check your internet connection and try again.",
        }),
      )
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
