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
};

export type ApiClientSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  status: number;
};

export type ApiClientErrorResponse = {
  success: false;
  message: string;
  data: null;
  status: number;
  error: string;
};

export type ApiClientResponse<T = void> =
  | ApiClientSuccessResponse<T>
  | ApiClientErrorResponse;
