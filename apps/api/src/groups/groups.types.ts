import type { Prisma } from '@repo/db';

export const GROUP_INCLUDE = {
  permissions: true,
  _count: { select: { users: true } },
} as const satisfies Prisma.GroupInclude;

export type GroupWithRelations = Prisma.GroupGetPayload<{
  include: typeof GROUP_INCLUDE;
}>;
