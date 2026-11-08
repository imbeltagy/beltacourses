import { Role } from '@repo/db';

export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL = 60_000; // In milliseconds
export const AUTH_THROTTLE = {
  default: {
    limit: AUTH_THROTTLE_LIMIT,
    ttl: AUTH_THROTTLE_TTL,
  },
};

export const REGISTERABLE_ROLES = [Role.student, Role.teacher] as const;
export const ASSIGNABLE_ROLES = [
  Role.student,
  Role.teacher,
  Role.academy_moderator,
  Role.admin,
] as const;

export const PASSWORD_SALT = process.env.PASSWORD_SALT;
export const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS;

export const MODERATOR_ROLES = [Role.admin, Role.super_admin] as const;

export function isModerator(role: Role): boolean {
  return (MODERATOR_ROLES as readonly Role[]).includes(role);
}

/** Reflector key `@Auth()` writes and `AuthGuard` reads. */
export const AUTH_OPTIONS_KEY = 'iam:auth-options';
