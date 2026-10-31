import { Test, TestingModule } from '@nestjs/testing';
import {
  AccessTokenGuard,
  PermissionsGuard,
  RolesGuard,
} from '@repo/backend/core';
import { GroupsController } from '../../src/groups/groups.controller';
import { GroupsService } from '../../src/groups/groups.service';
import { GroupResponseDto } from '../../src/groups/dto/response/group.dto';
import { groupRow } from '../helpers/rows';

describe('GroupsController', () => {
  let controller: GroupsController;
  let groupsService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    permissionCatalog: jest.Mock;
  };

  beforeEach(async () => {
    groupsService = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      permissionCatalog: jest.fn(),
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
    groupsService.create.mockResolvedValue(groupRow());

    await expect(controller.create(dto as never)).resolves.toBeInstanceOf(
      GroupResponseDto,
    );
    expect(groupsService.create).toHaveBeenCalledWith(dto);
  });

  it('list maps each row to GroupResponseDto and keeps the meta', async () => {
    const query = { page: 1, limit: 20 };
    groupsService.list.mockResolvedValue({
      data: [groupRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    const result = await controller.list(query as never);

    expect(groupsService.list).toHaveBeenCalledWith(query);
    expect(result.data[0]).toBeInstanceOf(GroupResponseDto);
    expect(result.data[0]).toMatchObject({
      permissions: ['users:read'],
      users_count: 2,
    });
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it('getById delegates to findById', async () => {
    groupsService.findById.mockResolvedValue(groupRow());

    await expect(controller.getById('group-1')).resolves.toMatchObject({
      id: 'group-1',
      permissions: ['users:read'],
    });
    expect(groupsService.findById).toHaveBeenCalledWith('group-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    groupsService.update.mockResolvedValue(groupRow());

    await controller.update('group-1', dto as never);

    expect(groupsService.update).toHaveBeenCalledWith('group-1', dto);
  });

  it('softDelete returns no body (204)', async () => {
    const { softDelete } = controller;

    const decoratedStatus: number = Reflect.getMetadata(
      '__httpCode__',
      softDelete,
    );
    expect(decoratedStatus).toBe(204);

    groupsService.softDelete.mockResolvedValue(undefined);

    await expect(controller.softDelete('group-1')).resolves.toBeUndefined();
    expect(groupsService.softDelete).toHaveBeenCalledWith('group-1');
  });
});
