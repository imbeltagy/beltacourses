import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

/**
 * Deliberately narrow: this exists only so `AccessTokenGuard` can check that a
 * token's user still exists, without depending on the users feature's own
 * (app-local) repository or service. Not a general-purpose users data layer.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<{ id: string } | null> {
    return this.prisma.client.user.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
  }
}
