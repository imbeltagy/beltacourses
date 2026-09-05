import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma';
import { PermissionsRepository } from '../../src/core/permissions.repository';

describe('PermissionsRepository', () => {
  let repository: PermissionsRepository;
  let prisma: { client: { user: { findFirst: jest.Mock } } };

  beforeEach(async () => {
    prisma = { client: { user: { findFirst: jest.fn() } } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(PermissionsRepository);
  });

  it('returns the flattened permission strings', async () => {
    prisma.client.user.findFirst.mockResolvedValue({
      group: {
        deleted_at: null,
        permissions: [{ permission: 'users:read' }, { permission: 'users:*' }],
      },
    });

    await expect(repository.findByUserId('admin-1')).resolves.toEqual([
      'users:read',
      'users:*',
    ]);
  });

  it('returns [] for a user with no group', async () => {
    prisma.client.user.findFirst.mockResolvedValue({ group: null });

    await expect(repository.findByUserId('admin-1')).resolves.toEqual([]);
  });

  it('returns [] for a soft-deleted group', async () => {
    prisma.client.user.findFirst.mockResolvedValue({
      group: { deleted_at: new Date(), permissions: [{ permission: 'users:*' }] },
    });

    await expect(repository.findByUserId('admin-1')).resolves.toEqual([]);
  });

  it('returns [] for an unknown/soft-deleted user', async () => {
    prisma.client.user.findFirst.mockResolvedValue(null);

    await expect(repository.findByUserId('unknown')).resolves.toEqual([]);
  });
});
