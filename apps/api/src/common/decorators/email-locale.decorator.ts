import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolveEmailLocale, type EmailLocale } from '@repo/backend/email';
import type { Request } from 'express';

/**
 * The locale for any email the request triggers, read from `Accept-Language`.
 * Always a shipped locale: a missing, empty or unknown header resolves to the
 * default, so a handler never has to check.
 */
export const EmailLocaleParam = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): EmailLocale =>
    resolveEmailLocale(
      ctx.switchToHttp().getRequest<Request>().header('accept-language'),
    ),
);
