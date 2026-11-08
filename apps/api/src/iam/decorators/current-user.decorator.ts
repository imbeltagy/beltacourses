import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { RequestUser } from '../types/auth.types';

/** `null` on a `@Auth({ public: true })` route. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: RequestUser | null }>();
    return request.user;
  },
);
