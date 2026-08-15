import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/service/prisma';
import { Prisma, Role, User } from '@repo/db';
import type { PublicUser } from './users.types';

export interface FindManyUsersQuery {
  page: number;
  limit: number;
  role?: Role;
  search?: string;
}

/**
 * Every read but {@link UsersRepository.findByEmailWithPassword} passes Prisma's
 * query-level `omit`, so the hash is unreachable by default rather than by
 * discipline. `deleted_at` goes with it: read paths already filter on it, and a
 * row that comes back is live by construction — leaving the column out is what
 * makes the returned row exactly a `PublicUser`.
 */
const OMIT_PRIVATE = { hashed_password: true, deleted_at: true } as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<PublicUser> {
    return this.prisma.client.user.create({ data, omit: OMIT_PRIVATE });
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.client.user.findFirst({
      where: { id, deleted_at: null },
      omit: OMIT_PRIVATE,
    });
  }

  /**
   * Uniqueness check, and the one read that deliberately sees soft-deleted rows:
   * the unique index spans them, so a check that filtered `deleted_at: null`
   * would report a burned address as free and then hit a constraint violation.
   * Only the id comes back — nothing else about a deleted user is anyone's
   * business here.
   */
  findIdByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  /**
   * The single documented escape hatch: login is the only caller that needs the
   * hash. Nothing else may return it.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.client.user.findFirst({
      where: { email, deleted_at: null },
    });
  }

  async findMany(
    query: FindManyUsersQuery,
  ): Promise<{ items: PublicUser[]; total: number }> {
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

    // One round trip, and the count can never drift from the page it describes.
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.user.findMany({
        where,
        omit: OMIT_PRIVATE,
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return { items, total };
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser> {
    return this.prisma.client.user.update({
      where: { id },
      data,
      omit: OMIT_PRIVATE,
    });
  }

  /**
   * Returns how many rows changed so the service can turn `0` into a 404. The
   * `deleted_at: null` guard keeps the original timestamp on a re-delete.
   */
  async softDelete(id: string): Promise<number> {
    const result = await this.prisma.client.user.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    return result.count;
  }
}
