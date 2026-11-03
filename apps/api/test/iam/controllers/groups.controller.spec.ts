import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from '../../../src/iam/controllers/groups.controller';
import { IamFacade } from '../../../src/iam/iam.facade';
import { GroupResponseDto } from '../../../src/iam/dto/response/group.dto';
import { groupRow } from '../../helpers/rows';

describe('GroupsController', () => {
  let controller: GroupsController;
  let iam: {
    createGroup: jest.Mock;
    getGroup: jest.Mock;
    listGroups: jest.Mock;
    updateGroup: jest.Mock;
    deleteGroup: jest.Mock;
    permissionCatalog: jest.Mock;
  };

  beforeEach(async () => {
    iam = {
      createGroup: jest.fn(),
      getGroup: jest.fn(),
      listGroups: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      permissionCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: IamFacade, useValue: iam }],
    }).compile();

    controller = module.get(GroupsController);
  });

  it('permissionCatalog delegates to the service', () => {
    iam.permissionCatalog.mockReturnValue({ USERS: {} });

    expect(controller.permissionCatalog()).toEqual({ USERS: {} });
  });

  it('create delegates to the service', async () => {
    const dto = { name: 'Support', permissions: ['users:read'] };
    iam.createGroup.mockResolvedValue(groupRow());

    await expect(controller.create(dto as never)).resolves.toBeInstanceOf(
      GroupResponseDto,
    );
    expect(iam.createGroup).toHaveBeenCalledWith(dto);
  });

  it('list maps each row to GroupResponseDto and keeps the meta', async () => {
    const query = { page: 1, limit: 20 };
    iam.listGroups.mockResolvedValue({
      data: [groupRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    const result = await controller.list(query as never);

    expect(iam.listGroups).toHaveBeenCalledWith(query);
    expect(result.data[0]).toBeInstanceOf(GroupResponseDto);
    expect(result.data[0]).toMatchObject({
      permissions: ['users:read'],
      users_count: 2,
    });
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it('getById delegates to findById', async () => {
    iam.getGroup.mockResolvedValue(groupRow());

    await expect(controller.getById('group-1')).resolves.toMatchObject({
      id: 'group-1',
      permissions: ['users:read'],
    });
    expect(iam.getGroup).toHaveBeenCalledWith('group-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    iam.updateGroup.mockResolvedValue(groupRow());

    await controller.update('group-1', dto as never);

    expect(iam.updateGroup).toHaveBeenCalledWith('group-1', dto);
  });

  it('delete returns no body (204)', async () => {
    const { delete: deleteGroup } = controller;

    const decoratedStatus: number = Reflect.getMetadata(
      '__httpCode__',
      deleteGroup,
    );
    expect(decoratedStatus).toBe(204);

    iam.deleteGroup.mockResolvedValue(undefined);

    await expect(controller.delete('group-1')).resolves.toBeUndefined();
    expect(iam.deleteGroup).toHaveBeenCalledWith('group-1');
  });
});
