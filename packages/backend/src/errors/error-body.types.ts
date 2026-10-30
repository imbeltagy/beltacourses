import type { ErrorCode } from './error-code';

export type ErrorBody = {
  code: number;
  error: ErrorCode;
  message?: string;
};
