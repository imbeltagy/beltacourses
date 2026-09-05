import { SetMetadata } from '@nestjs/common';
import type { Role } from '@repo/db';

export const ROLES_KEY = 'auth:roles';

/**
 * Decorators are evaluated at **import** time, so an empty `@Roles()` crashes
 * app boot rather than a request. That is the intent.
 */
export function Roles(...roles: Role[]) {
  if (roles.length === 0) {
    throw new Error('@Roles() requires at least one role');
  }
  return SetMetadata(ROLES_KEY, roles);
}
