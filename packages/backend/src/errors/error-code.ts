import { HttpStatus } from '@nestjs/common';

/**
 * Every error the API can return, as the `error` field of the response body.
 *
 * The frontend mirrors this list in `@repo/frontend-features`
 * (`types/api/errors.ts`) and keys its translations by these values under
 * `errors.api` — so adding a member here means adding it there and to both
 * message files. Values equal their names; never rename one, clients switch
 * on it.
 */
export enum ErrorCode {
  // Generic — what the exception filter falls back to.
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  MISSING_ACCESS_TOKEN = 'MISSING_ACCESS_TOKEN',
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Users
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ONLY_ADMIN_CAN_HAVE_GROUP = 'ONLY_ADMIN_CAN_HAVE_GROUP',

  // Groups
  GROUP_NAME_ALREADY_EXISTS = 'GROUP_NAME_ALREADY_EXISTS',
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  USER_NOT_IN_GROUP = 'USER_NOT_IN_GROUP',

  // Storage
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
}

/**
 * The HTTP status each code is sent with. Kept here, once, so a call site is
 * `new AppException(ErrorCode.X)` and cannot pair a code with the wrong status.
 */
export const ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [ErrorCode.VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.ROUTE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,

  [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.MISSING_ACCESS_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_ACCESS_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_REFRESH_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.SESSION_EXPIRED]: HttpStatus.UNAUTHORIZED,

  [ErrorCode.EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.ONLY_ADMIN_CAN_HAVE_GROUP]: HttpStatus.BAD_REQUEST,

  [ErrorCode.GROUP_NAME_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.GROUP_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.USER_NOT_IN_GROUP]: HttpStatus.NOT_FOUND,

  [ErrorCode.FILE_NOT_FOUND]: HttpStatus.NOT_FOUND,
};
