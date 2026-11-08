export type ApiFetchResult = {
  /** HTTP status; 0 when no response arrived. */
  status: number;
  /** Parsed JSON, raw text, or `undefined` for an empty or unreachable response. */
  payload: unknown;
};

/**
 * Plain server-side fetch for route handlers. Never throws: a network error
 * comes back as `{ status: 0, payload: undefined }`.
 */
export async function apiFetch(
  url: string,
  init?: RequestInit,
): Promise<ApiFetchResult> {
  try {
    const response = await fetch(url, { cache: "no-store", ...init });
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    let payload: unknown;
    try {
      payload = isJson ? await response.json() : await response.text();
    } catch {
      payload = undefined;
    }

    return { status: response.status, payload: payload || undefined };
  } catch {
    return { status: 0, payload: undefined };
  }
}
