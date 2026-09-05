import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/service/prisma';
import type { Prisma } from '@repo/db';
import type { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import type { PublicGroup } from './groups.types';

const INCLUDE = {
  permissions: { select: { permission: true } },
  _count: { select: { users: true } },
} as const;

function toPublicGroup(row: {
  id: string;
  name: string;
  description: string | null;
  permissions: { permission: string }[];
  _count: { users: number };
  created_at: Date;
  updated_at: Date;
}): PublicGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: row.permissions.map((p) => p.permission),
    users_count: row._count.users,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string | null;
    permissions: string[];
  }): Promise<PublicGroup> {
    const row = await this.prisma.client.group.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissions.map((permission) => ({ permission })),
        },
      },
      include: INCLUDE,
    });
    return toPublicGroup(row);
  }

  async findById(id: string): Promise<PublicGroup | null> {
    const row = await this.prisma.client.group.findFirst({
      where: { id, deleted_at: null },
      include: INCLUDE,
    });
    return row ? toPublicGroup(row) : null;
  }

  findIdByName(name: string): Promise<{ id: string } | null> {
    return this.prisma.client.group.findFirst({
      where: { name, deleted_at: null },
      select: { id: true },
    });
  }

  async findMany(
    query: ListGroupsQueryDto,
  ): Promise<{ items: PublicGroup[]; total: number }> {
    const where: Prisma.GroupWhereInput = {
      deleted_at: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.group.findMany({
        where,
        include: INCLUDE,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.client.group.count({ where }),
    ]);

    return { items: rows.map(toPublicGroup), total };
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      permissions?: string[];
    },
  ): Promise<PublicGroup> {
    const { permissions, ...rest } = data;

    const row = await this.prisma.client.$transaction(async (tx) => {
      if (permissions !== undefined) {
        await tx.groupPermission.deleteMany({ where: { group_id: id } });
        await tx.groupPermission.createMany({
          data: permissions.map((permission) => ({ group_id: id, permission })),
        });
      }

      return tx.group.update({
        where: { id },
        data: rest,
        include: INCLUDE,
      });
    });

    return toPublicGroup(row);
  }

  async softDelete(id: string): Promise<number> {
    const result = await this.prisma.client.group.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    return result.count;
  }
}
