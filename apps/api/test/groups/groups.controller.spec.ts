import { Test, TestingModule } from '@nestjs/testing';
import {
  AccessTokenGuard,
  PermissionsGuard,
  RolesGuard,
} from '@repo/service/core';
import { GroupsController } from '../../src/groups/groups.controller';
import { GroupsService } from '../../src/groups/groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let groupsService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    permissionCatalog: jest.Mock;
    assignUser: jest.Mock;
    unassignUser: jest.Mock;
  };

  beforeEach(async () => {
    groupsService = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      permissionCatalog: jest.fn(),
      assignUser: jest.fn(),
      unassignUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: groupsService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GroupsController);
  });

  it('permissionCatalog delegates to the service', () => {
    groupsService.permissionCatalog.mockReturnValue({ USERS: {} });

    expect(controller.permissionCatalog()).toEqual({ USERS: {} });
  });

  it('create delegates to the service', async () => {
    const dto = { name: 'Support', permissions: ['users:read'] };
    groupsService.create.mockResolvedValue({ id: 'group-1' });

    await expect(controller.create(dto as never)).resolves.toEqual({
      id: 'group-1',
    });
    expect(groupsService.create).toHaveBeenCalledWith(dto);
  });

  it('list delegates to the service', async () => {
    const query = { page: 1, limit: 20 };
    groupsService.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await controller.list(query as never);

    expect(groupsService.list).toHaveBeenCalledWith(query);
  });

  it('getById delegates to findById', async () => {
    groupsService.findById.mockResolvedValue({ id: 'group-1' });

    await expect(controller.getById('group-1')).resolves.toEqual({
      id: 'group-1',
    });
    expect(groupsService.findById).toHaveBeenCalledWith('group-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    groupsService.update.mockResolvedValue({ id: 'group-1' });

    await controller.update('group-1', dto as never);

    expect(groupsService.update).toHaveBeenCalledWith('group-1', dto);
  });

  it('softDelete returns no body (204)', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { softDelete } = controller;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoratedStatus: number = Reflect.getMetadata(
      '__httpCode__',
      softDelete,
    );
    expect(decoratedStatus).toBe(204);

    groupsService.softDelete.mockResolvedValue(undefined);

    await expect(controller.softDelete('group-1')).resolves.toBeUndefined();
    expect(groupsService.softDelete).toHaveBeenCalledWith('group-1');
  });

  it('assignUser returns the updated user', async () => {
    groupsService.assignUser.mockResolvedValue({
      id: 'user-1',
      group: { id: 'group-1' },
    });

    await expect(controller.assignUser('group-1', 'user-1')).resolves.toEqual({
      id: 'user-1',
      group: { id: 'group-1' },
    });
    expect(groupsService.assignUser).toHaveBeenCalledWith('group-1', 'user-1');
  });

  it('unassignUser returns no body (204)', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { unassignUser } = controller;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoratedStatus: number = Reflect.getMetadata(
      '__httpCode__',
      unassignUser,
    );
    expect(decoratedStatus).toBe(204);

    groupsService.unassignUser.mockResolvedValue(undefined);

    await expect(
      controller.unassignUser('group-1', 'user-1'),
    ).resolves.toBeUndefined();
    expect(groupsService.unassignUser).toHaveBeenCalledWith(
      'group-1',
      'user-1',
    );
  });
});
