import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** An admin's effective permissions. `[]` for no group or a soft-deleted user. */
  async findByUserId(userId: string): Promise<string[]> {
    const row = await this.prisma.client.user.findFirst({
      where: { id: userId, deleted_at: null },
      select: {
        group: {
          select: { permissions: { select: { permission: true } } },
        },
      },
    });

    if (!row?.group) return [];
    return row.group.permissions.map((p) => p.permission);
  }
}
