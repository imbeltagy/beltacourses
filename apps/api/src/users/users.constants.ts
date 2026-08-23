import { Role } from '@repo/db';

/** super_admin is never assignable over HTTP. */
export const ASSIGNABLE_ROLES = Object.values(Role).filter(
  (role) => role !== Role.super_admin,
);

/** POST /auth/register only ever creates these two roles. */
export const REGISTERABLE_ROLES = [Role.student, Role.teacher] as const;
