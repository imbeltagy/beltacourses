import { extractError } from "./helpers";
import { getCookie, setCookie, Cookies } from "../cookies";

type RefreshResult =
  | { success: true }
  | { success: false; status: number; error: string; message: string };

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set — cannot build the /auth/refresh URL.",
  );
}
const refreshTokenApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;

type RefreshResponsePayload = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

// Concurrent 401/403s all await this same in-flight refresh instead of each
// firing their own request against /auth/refresh.
let refreshPromise: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  const refreshToken = await getCookie(Cookies.REFRESH_TOKEN);
  if (!refreshToken) {
    return {
      success: false,
      status: 401,
      error: "NO_REFRESH_TOKEN",
      message: SESSION_EXPIRED_MESSAGE,
    };
  }

  const res = await fetch(refreshTokenApiUrl, {
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

  // No refresh_token rotation — only the access token cookie is refreshed.
  const { access_token, expires_in } = payload as RefreshResponsePayload;
  await setCookie(Cookies.ACCESS_TOKEN, access_token, expires_in);

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
