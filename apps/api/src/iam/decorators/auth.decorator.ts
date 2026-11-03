import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@repo/backend/errors';
import { AUTH_OPTIONS_KEY } from '../constants/iam.constants';
import type { AuthOptions } from '../types/iam.types';

export type { AuthOptions };

/**
 * Declares who may call a route; the global `AuthGuard` enforces it. Every
 * route needs one — a route without it is a wiring error (500), so a route can
 * never be public by forgetting a decorator.
 *
 * - `@Auth({ public: true })` — no token needed, `request.user` is `null`.
 * - `@Auth({ public: false })` — any signed-in user.
 * - `@Auth({ roles })` / `@Auth({ permissions })` / both — narrower.
 *
 * Permissions only ever apply to `admin` (`super_admin` bypasses them), so a
 * client role on a permissions-only route is refused with 403. Works as a
 * method and a class decorator.
 */
export function Auth(options: AuthOptions) {
  if (options.public === true) {
    return applyDecorators(SetMetadata(AUTH_OPTIONS_KEY, options));
  }

  const restricted =
    options.roles !== undefined || options.permissions !== undefined;

  return applyDecorators(
    SetMetadata(AUTH_OPTIONS_KEY, options),
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({
      type: ErrorResponseDto,
      description:
        'Missing, invalid or expired access token, or the session was revoked.',
    }),
    ...(restricted
      ? [
          ApiForbiddenResponse({
            type: ErrorResponseDto,
            description:
              'Authenticated, but the role or permissions do not allow this.',
          }),
        ]
      : []),
  );
}
