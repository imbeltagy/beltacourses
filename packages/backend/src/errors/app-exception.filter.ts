import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppException } from './app.exception';
import type { ErrorBody } from './error-body.types';
import { ErrorCode } from './error-code';

/**
 * Makes every error leave the API as `{ code, error, message? }`.
 *
 * `AppException` is passed through. Anything else — Nest's own exceptions
 * (unknown route, a guard's bare `ForbiddenException`), body-parser errors,
 * and bugs — is mapped to a generic code, so the contract holds for errors
 * nobody wrote a code for. Unknown errors never leak their message.
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception);

    if (body.code >= 500) {
      this.logger.error(
        `${body.error}${body.message ? `: ${body.message}` : ''}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const { httpAdapter } = this.httpAdapterHost;
    httpAdapter.reply(host.switchToHttp().getResponse(), body, body.code);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof AppException) {
      return exception.getResponse() as ErrorBody;
    }

    if (exception instanceof HttpException) {
      return this.fromStatus(
        exception.getStatus(),
        messageOf(exception.getResponse()),
      );
    }

    // http-errors (body-parser: malformed JSON, payload too large) are not
    // HttpExceptions but carry a client-error status.
    const status = (exception as { status?: unknown } | null)?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return this.fromStatus(status, (exception as Error).message);
    }

    return { code: 500, error: ErrorCode.INTERNAL_ERROR };
  }

  private fromStatus(status: number, message?: string): ErrorBody {
    return {
      code: status,
      error: GENERIC_BY_STATUS[status] ?? fallbackFor(status),
      // A 5xx message is an internal detail; only 4xx messages are sent.
      ...(message && status < 500 ? { message } : {}),
    };
  }
}

const GENERIC_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.NOT_FOUND]: ErrorCode.ROUTE_NOT_FOUND,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

function fallbackFor(status: number): ErrorCode {
  return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
}

/** Nest's response is a string, or `{ message: string | string[] }`. */
function messageOf(response: string | object): string | undefined {
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : undefined;
}
