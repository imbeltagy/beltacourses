import type { Prisma, Role } from '@repo/db';

export const USER_INCLUDE = {
  avatar: true,
  group: true,
} as const satisfies Prisma.UserInclude;

/** A user row as Prisma returns it with `USER_INCLUDE`. */
export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export const GROUP_INCLUDE = {
  permissions: true,
  _count: { select: { users: true } },
} as const satisfies Prisma.GroupInclude;

export type GroupWithRelations = Prisma.GroupGetPayload<{
  include: typeof GROUP_INCLUDE;
}>;

/** Which login flow issued a token pair. Decides the issuer and the TTLs. */
export type AuthKind = 'client' | 'moderator';

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

/** Snapshot stored in Redis under `session:{sid}`. */
export type Session = {
  userId: string;
  role: Role;
  groupId: string | null;
  permissions: string[];
  hashedRefreshToken: string;
};
