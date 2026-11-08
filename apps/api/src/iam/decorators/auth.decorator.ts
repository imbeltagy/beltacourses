import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@repo/backend/errors';
import { AUTH_OPTIONS_KEY } from '../constants/auth.constants';
import type { AuthOptions } from '../types/auth.types';

export type { AuthOptions };

export function Auth(options: AuthOptions) {
  if (options.public === true) {
    return applyDecorators(
      SetMetadata(AUTH_OPTIONS_KEY, options),
      ApiBearerAuth('access-token'),
    );
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
