import type { Role } from '@repo/db';
import { isModerator } from './auth.constants';

export const CLIENT_LOGIN_PATH = '/auth/login';
export const MODERATOR_LOGIN_PATH = '/auth/moderators/login';
export const API_DOMAIN = process.env.API_DOMAIN;

// Secrets
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
export const REFRESH_TOKEN_HASH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET;

// Tokens TTL
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
