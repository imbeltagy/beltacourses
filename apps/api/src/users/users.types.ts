import type { Prisma } from '@repo/db';

export const USER_INCLUDE = {
  avatar: true,
  group: true,
} as const satisfies Prisma.UserInclude;

/** A user row as Prisma returns it with `USER_INCLUDE`. */
export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;
