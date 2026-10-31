import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/backend/prisma';
import type { Prisma, User } from '@repo/db';
import type { ListUsersQueryDto } from './dto/request/list-users.dto';
import { USER_INCLUDE, type UserWithRelations } from './users.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserUncheckedCreateInput): Promise<UserWithRelations> {
    return this.prisma.client.user.create({
      data,
      include: USER_INCLUDE,
    });
  }

  findById(id: string): Promise<UserWithRelations | null> {
    return this.prisma.client.user.findFirst({
      where: { id, deleted_at: null },
      include: USER_INCLUDE,
    });
  }

  findIdByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  /** The only method that returns the hash. Login only. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.client.user.findFirst({
      where: { email, deleted_at: null },
    });
  }

  async findMany(
    query: ListUsersQueryDto,
  ): Promise<{ items: UserWithRelations[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      deleted_at: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.user.findMany({
        where,
        include: USER_INCLUDE,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return { items, total };
  }

  update(
    id: string,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<UserWithRelations> {
    return this.prisma.client.user.update({
      where: { id },
      data,
      include: USER_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<number> {
    const result = await this.prisma.client.user.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    return result.count;
  }
}
