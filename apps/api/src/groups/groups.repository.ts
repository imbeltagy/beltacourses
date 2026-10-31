import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/backend/prisma';
import type { Prisma } from '@repo/db';
import type { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import { GROUP_INCLUDE, type GroupWithRelations } from './groups.types';

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    name: string;
    description?: string | null;
    permissions: string[];
  }): Promise<GroupWithRelations> {
    return this.prisma.client.group.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          create: data.permissions.map((permission) => ({ permission })),
        },
      },
      include: GROUP_INCLUDE,
    });
  }

  findById(id: string): Promise<GroupWithRelations | null> {
    return this.prisma.client.group.findFirst({
      where: { id },
      include: GROUP_INCLUDE,
    });
  }

  findIdByName(name: string): Promise<{ id: string } | null> {
    return this.prisma.client.group.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  async findMany(
    query: ListGroupsQueryDto,
  ): Promise<{ items: GroupWithRelations[]; total: number }> {
    const where: Prisma.GroupWhereInput = {
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.group.findMany({
        where,
        include: GROUP_INCLUDE,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.client.group.count({ where }),
    ]);

    return { items, total };
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      permissions?: string[];
    },
  ): Promise<GroupWithRelations> {
    const { permissions, ...rest } = data;

    return this.prisma.client.$transaction(async (tx) => {
      if (permissions !== undefined) {
        await tx.groupPermission.deleteMany({ where: { group_id: id } });
        await tx.groupPermission.createMany({
          data: permissions.map((permission) => ({ group_id: id, permission })),
        });
      }

      return tx.group.update({
        where: { id },
        data: rest,
        include: GROUP_INCLUDE,
      });
    });
  }

  /** Permissions cascade; members' `group_id` is cleared by the FK. */
  async delete(id: string) {
    await this.prisma.client.group.delete({
      where: { id },
    });
  }
}
