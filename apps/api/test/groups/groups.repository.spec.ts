import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@repo/service/prisma';
import { GroupsRepository } from '../../src/groups/groups.repository';

const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'group-1',
  name: 'Support',
  description: null,
  permissions: [{ permission: 'users:read' }],
  _count: { users: 2 },
  created_at: new Date('2026-08-01T00:00:00.000Z'),
  updated_at: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
});

describe('GroupsRepository', () => {
  let repository: GroupsRepository;
  let prisma: {
    client: {
      group: {
        create: jest.Mock;
        findFirst: jest.Mock;
        findMany: jest.Mock;
        count: jest.Mock;
        update: jest.Mock;
        updateMany: jest.Mock;
      };
      groupPermission: { deleteMany: jest.Mock; createMany: jest.Mock };
      $transaction: jest.Mock;
    };
  };

  beforeEach(async () => {
    const group = {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    };
    const groupPermission = { deleteMany: jest.fn(), createMany: jest.fn() };
    prisma = {
      client: {
        group,
        groupPermission,
        $transaction: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(GroupsRepository);
  });

  it('flattens permissions to string[] and reads users_count from _count', async () => {
    prisma.client.group.findFirst.mockResolvedValue(row());

    const result = await repository.findById('group-1');

    expect(result).toEqual({
      id: 'group-1',
      name: 'Support',
      description: null,
      permissions: ['users:read'],
      users_count: 2,
      created_at: row().created_at,
      updated_at: row().updated_at,
    });
  });

  it('findById filters deleted_at: null', async () => {
    prisma.client.group.findFirst.mockResolvedValue(null);

    await repository.findById('group-1');

    expect(prisma.client.group.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'group-1', deleted_at: null } }),
    );
  });

  it('findMany filters deleted_at: null', async () => {
    prisma.client.$transaction.mockResolvedValue([[row()], 1]);

    await repository.findMany({ page: 1, limit: 20 });

    const [[findManyCall]] = prisma.client.$transaction.mock.calls as [
      unknown[],
    ];
    expect(findManyCall).toBeDefined();
  });

  it('update with permissions runs delete-then-create inside $transaction', async () => {
    const tx = {
      groupPermission: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn().mockResolvedValue(undefined),
      },
      group: { update: jest.fn().mockResolvedValue(row()) },
    };
    prisma.client.$transaction.mockImplementation(
      (cb: (transaction: typeof tx) => unknown) => Promise.resolve(cb(tx)),
    );

    await repository.update('group-1', { permissions: ['users:*'] });

    expect(tx.groupPermission.deleteMany).toHaveBeenCalledWith({
      where: { group_id: 'group-1' },
    });
    expect(tx.groupPermission.createMany).toHaveBeenCalledWith({
      data: [{ group_id: 'group-1', permission: 'users:*' }],
    });
    expect(prisma.client.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it('softDelete guards on deleted_at: null', async () => {
    prisma.client.group.updateMany.mockResolvedValue({ count: 1 });

    const count = await repository.softDelete('group-1');

    expect(prisma.client.group.updateMany).toHaveBeenCalledWith({
      where: { id: 'group-1', deleted_at: null },
      data: { deleted_at: expect.any(Date) as Date },
    });
    expect(count).toBe(1);
  });
});
