import type { useTranslations } from "next-intl";
import type { Messages } from "@repo/frontend/i18n/types";
import {
  API_ERROR_CODES,
  CLIENT_ERROR_CODES,
  type ApiErrorCode,
  type ClientErrorCodeValue,
} from "../types/api/errors";

/** A translator scoped to `errors` — from `useTranslations` or `getTranslations`. */
type ErrorsTranslator = ReturnType<typeof useTranslations<"errors">>;

/** One per kind of request, so the fallback says what failed. */
export type ErrorFallback = keyof Messages["errors"]["fallback"];

const isApiError = (error: string): error is ApiErrorCode =>
  (API_ERROR_CODES as readonly string[]).includes(error);

const isClientError = (error: string): error is ClientErrorCodeValue =>
  (CLIENT_ERROR_CODES as readonly string[]).includes(error);

/**
 * The one place an action's `error` becomes text. The server's `message` is
 * never involved. A code this build does not know — the API is ahead of the
 * frontend — gets the request's own fallback ("Couldn't log in…"), not a
 * global "Something went wrong".
 */
export function localizeError(
  t: ErrorsTranslator,
  error: string,
  fallback: ErrorFallback,
): string {
  if (isApiError(error)) return t(`api.${error}`);
  if (isClientError(error)) return t(`client.${error}`);
  return t(`fallback.${fallback}`);
}
