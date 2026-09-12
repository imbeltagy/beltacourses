import { buildUrl, extractError } from "./helpers";
import { APIMethod, ApiClientResponse, RequestOptions } from "./types";
import { refreshAccessToken } from "./refresh-token";

const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Please check your internet connection and try again.";

export class ApiClient {
  private guest: boolean;

  constructor({ guest }: { guest: boolean }) {
    this.guest = guest;
  }

  private reportFailure(params: {
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
  private async apiRequest<ResponseType = void>(
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

      if (!this.guest) {
        const accessToken = "dump-token";
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
      if ((res.status === 401 || res.status === 403) && !retried && !this.guest) {
        const refreshResult = await refreshAccessToken();

        if (refreshResult.success) {
          return this.apiRequest<ResponseType>(url, method, options, true);
        }

        this.reportFailure({
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

      this.reportFailure({
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
      this.reportFailure({ method, url, status: 0, body: options?.body });

      return {
        success: false,
        data: null,
        status: 0,
        error: "NETWORK_ERROR",
        message: NETWORK_ERROR_MESSAGE,
      };
    }
  }

  get<ResponseType = void>(
    path: string,
    options?: Omit<RequestOptions, "body">,
  ) {
    return this.apiRequest<ResponseType>(path, "GET", options);
  }

  post<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return this.apiRequest<ResponseType>(path, "POST", { ...options, body });
  }

  put<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return this.apiRequest<ResponseType>(path, "PUT", { ...options, body });
  }

  patch<ResponseType = void>(
    path: string,
    body: object | FormData,
    options?: Omit<RequestOptions, "body">,
  ) {
    return this.apiRequest<ResponseType>(path, "PATCH", { ...options, body });
  }

  delete<ResponseType = void>(
    path: string,
    options?: Omit<RequestOptions, "body">,
  ) {
    return this.apiRequest<ResponseType>(path, "DELETE", options);
  }
}
