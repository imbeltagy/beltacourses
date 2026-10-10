import { HttpException } from '@nestjs/common';
import { ERROR_STATUS, ErrorCode } from './error-code';
import type { ErrorBody } from './error-body.types';

/** Throw this instead of Nest's `*Exception` classes. */
export class AppException extends HttpException {
  constructor(
    readonly error: ErrorCode,
    message?: string,
  ) {
    const code = ERROR_STATUS[error];
    const body: ErrorBody = { code, error, ...(message ? { message } : {}) };
    super(body, code);
  }
}
