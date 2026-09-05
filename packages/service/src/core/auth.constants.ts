import { Role } from '@repo/db';

export const CLIENT_ROLES = [
  Role.student,
  Role.teacher,
  Role.academy_moderator,
] as const;
export const MODERATOR_ROLES = [Role.admin, Role.super_admin] as const;

/** The only place "client vs moderator" is decided. Nothing stores this. */
export function isModerator(role: Role): boolean {
  return (MODERATOR_ROLES as readonly Role[]).includes(role);
}

export const CLIENT_ACCESS_TOKEN_TTL_SECONDS = 30 * 60; // 30 min
export const CLIENT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 d
export const MODERATOR_ACCESS_TOKEN_TTL_SECONDS = 5 * 60; // 5 min
export const MODERATOR_REFRESH_TOKEN_TTL_SECONDS = 10 * 60 * 60; // 10 h

/**
 * Redis key for one moderator session. Value: HMAC-SHA256 of the refresh token.
 * Deliberately a different prefix from `sessionIndexKey` — the index is a SET
 * and the entries are strings, so they must not share a prefix that a future
 * `SCAN MATCH` would conflate.
 */
export function sessionKey(userId: string, sid: string): string {
  return `session:${userId}:${sid}`;
}

/** Redis SET of one user's live sids, so revoke-all needs no SCAN. */
export function sessionIndexKey(userId: string): string {
  return `sessions:${userId}`;
}
