import { applyDecorators, Type, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AccessTokenGuard,
  Permissions,
  PermissionsGuard,
  Roles,
  RolesGuard,
  type Permission,
} from '@repo/service/core';
import type { Role } from '@repo/db';

export type AuthOptions = {
  roles?: Role | readonly Role[];
  /**
   * `PermissionsGuard` refuses every client role outright (D9), so
   * `@Auth({ permissions })` on its own already means "staff who hold these
   * permissions" — a student cannot slip through a route that forgot
   * `@Roles`. Passing both is still the clearer thing to write when a route
   * is meant for one specific role (e.g. `super_admin`-only writes, which
   * declare `roles` and no permissions at all). Do not "harden" this by
   * making `roles` mandatory — it is not needed for safety.
   */
  permissions?: Permission | readonly Permission[];
};

function toArray<T>(value: T | readonly T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? [...value] : [value as T];
}

/**
 * `@Auth()` composes the three guards (in the fixed order `AccessTokenGuard,
 * RolesGuard, PermissionsGuard` — Nest runs them in the order given to
 * `UseGuards`) with the `@Roles()`/`@Permissions()` metadata decorators and
 * the matching Swagger annotations. Works as both a method and a class
 * decorator.
 */
export function Auth(options: AuthOptions = {}) {
  const roles = toArray(options.roles);
  const permissions = toArray(options.permissions);

  const guards: Type[] = [AccessTokenGuard];
  const decorators = [
    ApiBearerAuth('access-token'),
    ApiUnauthorizedResponse({
      description:
        'Missing, invalid or expired access token, or the session was revoked.',
    }),
  ];

  if (roles.length > 0) {
    guards.push(RolesGuard);
    decorators.push(Roles(...roles));
  }

  if (permissions.length > 0) {
    guards.push(PermissionsGuard);
    decorators.push(Permissions(...permissions));
  }

  if (roles.length > 0 || permissions.length > 0) {
    decorators.push(
      ApiForbiddenResponse({
        description:
          'Authenticated, but the role or permissions do not allow this.',
      }),
    );
  }

  return applyDecorators(UseGuards(...guards), ...decorators);
}
