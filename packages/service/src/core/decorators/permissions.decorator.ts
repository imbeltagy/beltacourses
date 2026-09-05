import { SetMetadata } from '@nestjs/common';
import { isPermission, type Permission } from '../permissions.constants';

export const PERMISSIONS_KEY = 'auth:permissions';

/**
 * The catalog check (`isPermission`) is belt-and-braces behind the
 * `Permission` literal type — it catches a string that reached the
 * decorator through an `as` cast or a JS caller, again at boot.
 */
export function Permissions(...permissions: Permission[]) {
  if (permissions.length === 0) {
    throw new Error('@Permissions() requires at least one permission');
  }
  const unknown = permissions.filter((p) => !isPermission(p));
  if (unknown.length > 0) {
    throw new Error(`@Permissions() got unknown permission(s): ${unknown.join(', ')}`);
  }
  return SetMetadata(PERMISSIONS_KEY, permissions);
}
