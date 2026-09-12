import { Query, Params, Queries } from "./types";

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

// Pull a { error, message } pair out of a common API error response shape.
// An array is reduced to its first item before anything else is checked.
export function extractError(
  payload: unknown,
): { error: string; message: string } | undefined {
  const source = Array.isArray(payload) ? payload[0] : payload;

  if (typeof source === "string" && source.trim()) {
    return { error: source, message: source };
  }

  if (!source || typeof source !== "object") return undefined;

  const record = source as Record<string, unknown>;
  const error = typeof record.error === "string" ? record.error.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";

  if (error && message) return { error, message };
  if (message) return { error: message, message };
  if (error) return { error, message: error };

  return undefined;
}
