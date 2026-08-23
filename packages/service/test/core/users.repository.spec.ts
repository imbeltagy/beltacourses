import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma';
import { UsersRepository } from '../../src/core/users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: { client: { user: { findFirst: jest.Mock } } };

  beforeEach(async () => {
    prisma = { client: { user: { findFirst: jest.fn() } } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(UsersRepository);
  });

  describe('findById', () => {
    it('filters out soft-deleted rows and selects only the id', async () => {
      prisma.client.user.findFirst.mockResolvedValue({ id: 'user-1' });

      await repository.findById('user-1');

      expect(prisma.client.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-1', deleted_at: null },
        select: { id: true },
      });
    });

    it('returns null when nothing live matches', async () => {
      prisma.client.user.findFirst.mockResolvedValue(null);

      await expect(repository.findById('user-1')).resolves.toBeNull();
    });
  });
});
