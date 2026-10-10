import type { ErrorCode } from './error-code';

/**
 * The body of every non-2xx response.
 *
 * - `code` — the HTTP status, repeated in the body so a consumer holding only
 *   the payload (a log line, a queue message) still has it.
 * - `error` — the stable enum value clients switch on and localize.
 * - `message` — optional, English, for logs and developers. Clients must not
 *   show it to a user.
 */
export type ErrorBody = {
  code: number;
  error: ErrorCode;
  message?: string;
};
