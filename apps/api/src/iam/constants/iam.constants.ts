import { Role } from '@repo/db';

/** Login and refresh are the brute-forceable routes; everything else uses the global default. */
export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL = 60_000; // In milliseconds

/** super_admin is never assignable over HTTP. */
export const ASSIGNABLE_ROLES = Object.values(Role).filter(
  (role) => role !== Role.super_admin,
);

/** POST /auth/register only ever creates these two roles. */
export const REGISTERABLE_ROLES = [Role.student, Role.teacher] as const;
