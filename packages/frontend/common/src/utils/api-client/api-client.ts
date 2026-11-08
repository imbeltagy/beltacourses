// `RequestOptions.next` is Next's augmentation of `RequestInit`, so the
// reference lives here rather than in a package-level `global.d.ts` — it has to
// reach every package that type-checks this file, not just this one.
/// <reference types="next/types/global" />

import { buildUrl, parseErrorBody } from "./helpers";
import {
  APIMethod,
  ApiClientErrorResponse,
  ApiClientResponse,
  ClientErrorCode,
  RequestOptions,
} from "./types";
import { ErrorNotifier } from "../error-notifier";
import { useAuthStore } from "../auth-store";

type RefreshResult = { success: true } | ApiClientErrorResponse;

type RefreshResponsePayload = {
  access_token: string;
};

/** An error response the client produced itself, with no API body behind it. */
function failure(
  status: number,
  error: string,
  message?: string,
): ApiClientErrorResponse {
  return {
    success: false,
    data: null,
    status,
    code: status,
    error,
    ...(message ? { message } : {}),
  };
}

/**
 * Static-only: there is one client, and the token-refresh state lives on it.
 * Browser-only: the access token is kept in `useAuthStore`, and the httpOnly
 * cookies are owned by the same-origin route handlers it calls to refresh or
 * end the session. Authenticated by default; pass `{ guest: true }` for calls
 * that must not carry the access token (login, register).
 */
export class ApiClient {
  // Set once by `configure`. This package cannot import the endpoint map from
  // `@repo/frontend-features` (that would invert the dependency), so the URLs
  // it needs to call itself are injected instead of read from the env.
  private static refreshUrl: string | undefined;
  private static logoutUrl: string | undefined;

  // Concurrent 401/403s all await this same in-flight refresh instead of each
  // firing their own request against the refresh endpoint.
  private static refreshPromise: Promise<RefreshResult> | null = null;

  private constructor() {}

  static configure({
    refreshUrl,
    logoutUrl,
  }: {
    refreshUrl: string;
    logoutUrl: string;
  }) {
    ApiClient.refreshUrl = refreshUrl;
    ApiClient.logoutUrl = logoutUrl;
  }

  private static async performRefresh(): Promise<RefreshResult> {
    if (!ApiClient.refreshUrl) {
      throw new Error(
        "ApiClient.configure({ refreshUrl, logoutUrl }) must be called before an authenticated request can refresh its token.",
      );
    }

    // Same-origin: the browser sends the httpOnly refresh cookie by itself.
    // On failure the route handler has already cleared the cookies.
    const res = await fetch(ApiClient.refreshUrl, { method: "POST" });

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
      const body = parseErrorBody(payload);
      return body
        ? { success: false, data: null, status: res.status, ...body }
        : failure(
            res.status,
            ClientErrorCode.INVALID_ERROR_RESPONSE,
            undefined,
          );
    }

    const { access_token } = payload as RefreshResponsePayload;
    useAuthStore.getState().setAccessToken(access_token);

    return { success: true };
  }

  private static refreshSession(): Promise<RefreshResult> {
    if (!ApiClient.refreshPromise) {
      ApiClient.refreshPromise = ApiClient.performRefresh()
        .catch((): RefreshResult => failure(0, ClientErrorCode.NETWORK_ERROR))
        .finally(() => {
          ApiClient.refreshPromise = null;
        });
    }

    return ApiClient.refreshPromise;
  }

  private static reload() {
    window.location.reload();
  }

  /**
   * Ends the session: the route handler revokes it and clears the cookies, the
   * in-memory token is dropped, and the reload lets the server guards redirect.
   * Used by the logout button, and when a retried request still gets a 401.
   */
  static async logout(): Promise<void> {
    try {
      if (ApiClient.logoutUrl) {
        await fetch(ApiClient.logoutUrl, { method: "POST" });
      }
    } catch {
      // Best effort — the local session is dropped either way.
    }

    useAuthStore.getState().setAccessToken(undefined);
    ApiClient.reload();
  }

  /** Reports a failed response to the error notifier, then returns it. */
  private static fail(
    context: {
      method: APIMethod;
      url: string;
      body?: RequestOptions["body"];
      responsePayload?: unknown;
    },
    response: ApiClientErrorResponse,
  ): ApiClientErrorResponse {
    ErrorNotifier.notify({
      source: "api-client",
      method: context.method,
      url: context.url,
      status: response.status,
      error: response.error,
      message: response.message,
      requestBody: context.body,
      responsePayload: context.responsePayload,
    });

    return response;
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
      // No access token in memory (fresh page load): hydrate one from the
      // refresh cookie before the first authenticated request.
      if (!options?.guest && !useAuthStore.getState().accessToken) {
        const refreshResult = await ApiClient.refreshSession();

        if (!refreshResult.success) {
          ApiClient.reload();
          return ApiClient.fail(
            { method, url: fullUrl, body: options?.body },
            refreshResult,
          );
        }
      }

      const headers: Record<string, string> = {};

      if (!(options?.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (!options?.guest) {
        const accessToken = useAuthStore.getState().accessToken;
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
        return {
          success: true,
          data: payload as ResponseType,
          status: res.status,
        };
      }

      // Auth recovery: on 401/403, refresh once and replay the original
      // request. A failed refresh reloads (the route handler already cleared
      // the cookies). A 401 on the replay ends the session; a 403 on the
      // replay is a genuine permission error and is returned as-is.
      if (
        (res.status === 401 || res.status === 403) &&
        !retried &&
        !options?.guest
      ) {
        const refreshResult = await ApiClient.refreshSession();

        if (refreshResult.success) {
          return ApiClient.apiRequest<ResponseType>(url, method, options, true);
        }

        ApiClient.reload();
        return ApiClient.fail(
          { method, url: fullUrl, body: options?.body },
          refreshResult,
        );
      }

      if (retried && res.status === 401 && !options?.guest) {
        await ApiClient.logout();
      }

      const body = parseErrorBody(payload);

      if (!body) {
        // A non-2xx that broke the `{ code, error, message? }` contract.
        return ApiClient.fail(
          {
            method,
            url: fullUrl,
            body: options?.body,
            responsePayload: payload,
          },
          failure(res.status, ClientErrorCode.INVALID_ERROR_RESPONSE),
        );
      }

      return ApiClient.fail(
        { method, url: fullUrl, body: options?.body },
        { success: false, data: null, status: res.status, ...body },
      );
    } catch {
      return ApiClient.fail(
        { method, url: fullUrl, body: options?.body },
        failure(0, ClientErrorCode.NETWORK_ERROR),
      );
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
