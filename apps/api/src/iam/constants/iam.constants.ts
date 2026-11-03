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

/**
 * Environment reads. Never throw here — the consuming class validates in its
 * constructor and names every missing variable at once.
 */
export const PASSWORD_SALT = process.env.PASSWORD_SALT;
export const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const REFRESH_TOKEN_HASH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET;
export const API_DOMAIN = process.env.API_DOMAIN;

export const MODERATOR_ROLES = [Role.admin, Role.super_admin] as const;

export function isModerator(role: Role): boolean {
  return (MODERATOR_ROLES as readonly Role[]).includes(role);
}

export const CLIENT_ACCESS_TOKEN_TTL_SECONDS = 30 * 60; // 30 min
export const CLIENT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 d
export const MODERATOR_ACCESS_TOKEN_TTL_SECONDS = 5 * 60; // 5 min
export const MODERATOR_REFRESH_TOKEN_TTL_SECONDS = 10 * 60 * 60; // 10 h

export function accessTokenTtl(role: Role): number {
  return isModerator(role)
    ? MODERATOR_ACCESS_TOKEN_TTL_SECONDS
    : CLIENT_ACCESS_TOKEN_TTL_SECONDS;
}

export function refreshTokenTtl(role: Role): number {
  return isModerator(role)
    ? MODERATOR_REFRESH_TOKEN_TTL_SECONDS
    : CLIENT_REFRESH_TOKEN_TTL_SECONDS;
}

/** Paths the login endpoints are served on; the token `iss` is `${API_DOMAIN}${path}`. */
export const CLIENT_LOGIN_PATH = '/auth/login';
export const MODERATOR_LOGIN_PATH = '/auth/moderators/login';

export const SESSION_KEY_PREFIX = 'session:';
export const USER_SESSIONS_KEY_PREFIX = 'users-sessions:';

/** Reflector key `@Auth()` writes and `AuthGuard` reads. */
export const AUTH_OPTIONS_KEY = 'iam:auth-options';
