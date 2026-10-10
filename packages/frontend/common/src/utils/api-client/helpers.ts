import { Query, Params, Queries, ApiErrorBody } from "./types";

export const convertQueriesIntoString = (queries?: Queries) => {
  if (!queries) return "";

  const searchParams = new URLSearchParams();

  function appendQuery(key: string, value: Query) {
    switch (typeof value) {
      case "string":
        searchParams.append(key, value);
        break;
      case "number":
        searchParams.append(key, value.toString());
        break;
      case "boolean":
        searchParams.append(key, value.toString());
        break;
      default:
        break;
    }
  }

  Object.entries(queries).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        appendQuery(key, item);
      });
    } else {
      appendQuery(key, value);
    }
  });

  return searchParams.toString();
};

export const replaceUrlParams = (url: string, params?: Params) => {
  if (!params) return url;

  return Object.entries(params).reduce((acc, [key, value]) => {
    // Use regex with word boundaries to ensure exact parameter name matching
    const regex = new RegExp(`:${key}\\b`, "g");
    return acc.replace(regex, value);
  }, url);
};

export const buildUrl = (url: string, params?: Params, queries?: Queries) => {
  let fullUrl = replaceUrlParams(url, params);

  const stringQueries = convertQueriesIntoString(queries);

  if (stringQueries) {
    if (fullUrl.split("/").pop()?.includes("?")) {
      fullUrl += `&${stringQueries}`;
    } else {
      fullUrl += `?${stringQueries}`;
    }
  }

  return fullUrl;
};

export function formDataToObject(formData: FormData): object {
  const object: Record<string, string> = {};
  formData.forEach((value, key) => {
    object[key] = value as string;
  });
  return object;
}

/**
 * Validates the error contract: `{ code: number, error: string, message?: string }`.
 * Returns `undefined` for anything else — a proxy's HTML 502, a framework
 * default body — so the caller can report a contract violation rather than
 * guess at a code.
 */
export function parseErrorBody(payload: unknown): ApiErrorBody | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const { code, error, message } = payload as Record<string, unknown>;

  if (typeof code !== "number" || !Number.isInteger(code)) return undefined;
  if (typeof error !== "string" || !error.trim()) return undefined;
  if (message !== undefined && typeof message !== "string") return undefined;

  return { code, error, ...(message ? { message } : {}) };
}
