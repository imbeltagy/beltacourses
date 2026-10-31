import { ClientErrorCode } from "@repo/frontend/utils/api-client";

/**
 * Mirrors `ErrorCode` in `packages/backend/src/errors/error-code.ts` — the
 * `error` field of every non-2xx API response. Each value has a translation
 * under `errors.api` in the message files; `localizeError` is type-checked
 * against them, so adding a code here without a message fails to compile.
 *
 * A code the API adds before this list catches up is not a bug: it renders the
 * per-request fallback instead.
 */
export const API_ERROR_CODES = [
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
  "BAD_REQUEST",
  "VALIDATION_FAILED",
  "ROUTE_NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "TOO_MANY_REQUESTS",
  "INVALID_CREDENTIALS",
  "MISSING_ACCESS_TOKEN",
  "INVALID_ACCESS_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "SESSION_EXPIRED",
  "EMAIL_ALREADY_EXISTS",
  "USER_NOT_FOUND",
  "ONLY_ADMIN_CAN_HAVE_GROUP",
  "GROUP_NAME_ALREADY_EXISTS",
  "GROUP_NOT_FOUND",
  "FILE_NOT_FOUND",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Codes the frontend produces itself; translated under `errors.client`. */
export const CLIENT_ERROR_CODES = [
  ...Object.values(ClientErrorCode),
  /** Registration succeeded but the automatic sign-in after it did not. */
  "ACCOUNT_CREATED_LOGIN_FAILED",
] as const;

export type ClientErrorCodeValue = (typeof CLIENT_ERROR_CODES)[number];
