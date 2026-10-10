import type { ErrorCode } from '@repo/backend/errors';

/**
 * For `toThrow(errorWith(ErrorCode.X))`: matches an `AppException` by its
 * `error` code. Typed as `Error` because `toThrow` does not accept the
 * `any` that `expect.objectContaining` returns.
 */
export const errorWith = (error: ErrorCode): Error =>
  expect.objectContaining({ error }) as Error;
