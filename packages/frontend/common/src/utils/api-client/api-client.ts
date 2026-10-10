// `RequestOptions.next` is Next's augmentation of `RequestInit`, so the
// reference lives here rather than in a package-level `global.d.ts` — it has to
// reach every package that type-checks this file, not just this one.
/// <reference types="next/types/global" />

import { buildUrl, extractError } from "./helpers";
import { APIMethod, ApiClientResponse, RequestOptions } from "./types";
import { getCookie, setCookie, Cookies } from "../cookies";

const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Please check your internet connection and try again.";

type RefreshResult =
  | { success: true }
  | { success: false; status: number; error: string; message: string };

type RefreshResponsePayload = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";
const REFRESH_NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server to refresh your session. Please check your internet connection and try again.";

/**
 * Static-only: there is one client, and the token-refresh state lives on it.
 * Authenticated by default; pass `{ guest: true }` for calls that must not
 * carry the access-token cookie (login, register).
 */
export class ApiClient {
  // Set once by `configure`. This package cannot import the endpoint map from
  // `@repo/frontend-features` (that would invert the dependency), so the one
  // URL it needs to build itself is injected instead of read from the env.
  private static refreshUrl: string | undefined;

  // Concurrent 401/403s all await this same in-flight refresh instead of each
  // firing their own request against the refresh endpoint.
  private static refreshPromise: Promise<RefreshResult> | null = null;

  private constructor() {}

  static configure({ refreshUrl }: { refreshUrl: string }) {
    ApiClient.refreshUrl = refreshUrl;
  }

  private static async performRefresh(): Promise<RefreshResult> {
    if (!ApiClient.refreshUrl) {
      throw new Error(
        "ApiClient.configure({ refreshUrl }) must be called before an authenticated request can refresh its token.",
      );
    }

    const refreshToken = await getCookie(Cookies.REFRESH_TOKEN);
    if (!refreshToken) {
      return {
        success: false,
        status: 401,
        error: "NO_REFRESH_TOKEN",
        message: SESSION_EXPIRED_MESSAGE,
      };
    }

    const res = await fetch(ApiClient.refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
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

  private static refreshAccessToken(): Promise<RefreshResult> {
    if (!ApiClient.refreshPromise) {
      ApiClient.refreshPromise = ApiClient.performRefresh()
        .catch(
          (): RefreshResult => ({
            success: false,
            status: 0,
            error: "NETWORK_ERROR",
            message: REFRESH_NETWORK_ERROR_MESSAGE,
          }),
        )
        .finally(() => {
          ApiClient.refreshPromise = null;
        });
    }

    return ApiClient.refreshPromise;
  }

  private static reportFailure(params: {
    method: APIMethod;
    url: string;
    status: number;
    payload?: unknown;
    body?: RequestOptions["body"];
  }) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[${params.method}] ${params.url} failed`, params);
      return;
    }
  }

  // Never throws — every path resolves to an ApiClientResponse.
  private static async apiRequest<ResponseType = void>(
    url: string,
    method: APIMethod,
    options?: RequestOptions,
    // True once this request is itself the retry that follows a token
    // refresh, so a second 401/403 is returned as-is instead of looping.
    retried = false,
  ): Promise<ApiClientResponse<ResponseType>> {
    const fullUrl = buildUrl(url, options?.params, options?.queries);

    try {
      const headers: Record<string, string> = {};

      if (!(options?.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (!options?.guest) {
        const accessToken = await getCookie(Cookies.ACCESS_TOKEN);
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
      }

      const res = await fetch(fullUrl, {
        method,
        headers: { ...headers, ...(options?.headers || {}) } as HeadersInit,
        body:
          options?.body instanceof FormData
            ? options?.body
            : JSON.stringify(options?.body),
        cache: options?.cache,
        next: options?.next,
      });

      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      let payload: unknown;
      try {
        payload = isJson ? await res.json() : (await res.text()) || undefined;
      } catch {
        payload = undefined;
      }

      const isSuccess = res.status >= 200 && res.status < 400;

      if (isSuccess) {
        const message =
          payload &&
          typeof payload === "object" &&
          typeof (payload as Record<string, unknown>).message === "string"
            ? ((payload as Record<string, unknown>).message as string)
            : "success";

        return {
          success: true,
          data: payload as ResponseType,
          status: res.status,
          message,
        };
      }

      // Auth recovery: on 401/403, refresh once and replay the original
      // request. No logout here — a failed refresh (or a second 401/403 on
      // the replay) is just returned as the final error.
      if (
        (res.status === 401 || res.status === 403) &&
        !retried &&
        !options?.guest
      ) {
        const refreshResult = await ApiClient.refreshAccessToken();

        if (refreshResult.success) {
          return ApiClient.apiRequest<ResponseType>(url, method, options, true);
        }

        ApiClient.reportFailure({
          method,
          url: fullUrl,
          status: refreshResult.status,
        });

        return {
          success: false,
          data: null,
          status: refreshResult.status,
          error: refreshResult.error,
          message: refreshResult.message,
        };
      }

      const extracted = extractError(payload);

      ApiClient.reportFailure({
        method,
        url: fullUrl,
        status: res.status,
        payload,
        body: options?.body,
      });

      return {
        success: false,
        data: null,
        status: res.status,
        error: extracted?.error ?? "REQUEST_FAILED",
        message: extracted?.message ?? UNEXPECTED_ERROR_MESSAGE,
      };
    } catch {
      ApiClient.reportFailure({ method, url, status: 0, body: options?.body });

      return {
        success: false,
        data: null,
        status: 0,
        error: "NETWORK_ERROR",
        message: NETWORK_ERROR_MESSAGE,
      };
    }
  }

  static get<ResponseType = void>(
    path: string,
    options?: Omit<RequestOptions, "body">,
  ) {
    return ApiClient.apiRequest<ResponseType>(path, "GET", options);
  }

  static post<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return ApiClient.apiRequest<ResponseType>(path, "POST", {
      ...options,
      body,
    });
  }

  static put<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return ApiClient.apiRequest<ResponseType>(path, "PUT", {
      ...options,
      body,
    });
  }

  static patch<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return ApiClient.apiRequest<ResponseType>(path, "PATCH", {
      ...options,
      body,
    });
  }

  static delete<ResponseType = void>(
    path: string,
    options?: Omit<RequestOptions, "body">,
  ) {
    return ApiClient.apiRequest<ResponseType>(path, "DELETE", options);
  }
}
