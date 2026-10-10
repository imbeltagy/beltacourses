export type APIMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type Query = string | number | boolean | undefined;
export type Queries = Record<string, Query | Query[]>;
export type Params = Record<string, string>;

// Define a type for the request options
export type RequestOptions = {
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: {
    tags?: string[];
    revalidate?: number | false;
  };
  queries?: Queries; // ?query=value&query2=value2
  params?: Params; // URL/:param/:param2
  body?: object | FormData;
  // Skip the access-token cookie and the refresh-and-replay on 401/403.
  guest?: boolean;
};

/**
 * The body of every non-2xx API response. `code` is the HTTP status, `error`
 * the stable enum value to localize, `message` an optional English detail for
 * logs — never shown to a user.
 */
export type ApiErrorBody = {
  code: number;
  error: string;
  message?: string;
};

/**
 * `error` values the client itself produces when there is no usable API error
 * body. They live beside the API's enum values in the message files.
 */
export const ClientErrorCode = {
  /** The request never got a response. */
  NETWORK_ERROR: "NETWORK_ERROR",
  /** A non-2xx response whose body was not `{ code, error, message? }`. */
  INVALID_ERROR_RESPONSE: "INVALID_ERROR_RESPONSE",
  /** A 401/403 with no refresh-token cookie to recover with. */
  NO_REFRESH_TOKEN: "NO_REFRESH_TOKEN",
} as const;

export type ApiClientSuccessResponse<T> = {
  success: true;
  data: T;
  status: number;
};

export type ApiClientErrorResponse = {
  success: false;
  data: null;
  /** HTTP status; 0 when no response arrived. */
  status: number;
} & ApiErrorBody;

export type ApiClientResponse<T = void> =
  | ApiClientSuccessResponse<T>
  | ApiClientErrorResponse;
