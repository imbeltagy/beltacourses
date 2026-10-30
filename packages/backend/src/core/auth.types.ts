import type { Role } from '@repo/db';

/** Token payload (part of claims) */
export type TokenUser = { id: string; email: string; name: string; role: Role };

export type TokenType = 'access' | 'refresh';

export type TokenClaims = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  sid?: string;
  typ: TokenType;
  iat: number;
  exp: number;
};

/** What the guards attach to `request.user` and `@CurrentUser()` returns. */
export type RequestUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Moderators only. */
  sid?: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
};
