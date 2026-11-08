import type { Role } from '@repo/db';

/** What a token is minted for. */
export type TokenSubject = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AccessClaims = {
  sub: string;
  sid: string;
  role: Role;
  email: string;
  name: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

export type RefreshClaims = {
  sid: string;
  /** Random per token, so two refreshes in the same second never collide. */
  jti: string;
  userId: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_expires_in: number;
};
