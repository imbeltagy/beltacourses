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

/** What `@CurrentUser()` returns. */
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
 * Argument of `@Auth()`.
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
