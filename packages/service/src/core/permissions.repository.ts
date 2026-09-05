import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

/**
 * Replaces the deleted `core/users.repository.ts`. Prisma only.
 */
@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** An admin's effective permissions. `[]` for no group, a soft-deleted group, or a soft-deleted user. */
  async findByUserId(userId: string): Promise<string[]> {
    const row = await this.prisma.client.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: {
        group: {
          select: { deleted_at: true, permissions: { select: { permission: true } } },
        },
      },
    });

    if (!row?.group || row.group.deleted_at) return [];
    return row.group.permissions.map((p) => p.permission);
  }
}
