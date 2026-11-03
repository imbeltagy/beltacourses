import type { Prisma, Role } from '@repo/db';
import type { Permission } from '../constants/permissions.constants';

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

/** Snapshot stored in Redis under `session:{sid}`. */
export type Session = {
  userId: string;
  role: Role;
  groupId: string | null;
  permissions: string[];
  hashedRefreshToken: string;
};

/** What the guard attaches to `request.user` and `@CurrentUser()` returns. */
export type RequestUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  sid: string;
  /** Snapshot from the session; `null` for clients and admins with no group. */
  groupId: string | null;
  permissions: string[];
};

/**
 * Argument of `@Auth()`. A union so the compiler rejects `@Auth({})` (say what
 * the route needs, or `{ public: false }` for "any signed-in user") and a
 * public route that also names roles or permissions.
 */
export type AuthOptions =
  | { public: true; roles?: never; permissions?: never }
  | {
      public: false;
      roles?: Role | readonly Role[];
      permissions?: Permission | readonly Permission[];
    }
  | {
      public?: undefined;
      roles: Role | readonly Role[];
      permissions?: Permission | readonly Permission[];
    }
  | {
      public?: undefined;
      roles?: Role | readonly Role[];
      permissions: Permission | readonly Permission[];
    };
