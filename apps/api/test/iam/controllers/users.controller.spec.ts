import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import type { RequestUser } from '../../../src/iam/types/iam.types';
import { UsersController } from '../../../src/iam/controllers/users.controller';
import { IamFacade } from '../../../src/iam/iam.facade';
import { UserResponseDto } from '../../../src/iam/dto/response/user.dto';
import { userRow } from '../../helpers/rows';

const REQUEST_USER: RequestUser = {
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane',
  role: Role.student,
  sid: 'sid-1',
  groupId: null,
  permissions: [],
};

describe('UsersController', () => {
  let controller: UsersController;
  let iam: {
    createUser: jest.Mock;
    getUser: jest.Mock;
    listUsers: jest.Mock;
    updateUser: jest.Mock;
    deleteUser: jest.Mock;
    assignGroup: jest.Mock;
  };

  beforeEach(async () => {
    iam = {
      createUser: jest.fn(),
      getUser: jest.fn(),
      listUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      assignGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: IamFacade, useValue: iam }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('create delegates to the service', async () => {
    const dto = { email: 'a@example.com', password: 'password', name: 'A' };
    iam.createUser.mockResolvedValue(userRow());

    await expect(
      controller.create(dto as never, undefined, 'en'),
    ).resolves.toBeInstanceOf(UserResponseDto);
    expect(iam.createUser).toHaveBeenCalledWith(dto, undefined, 'en');
  });

  it('create forwards the uploaded avatar file to the service', async () => {
    const dto = { email: 'a@example.com', password: 'password', name: 'A' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    iam.createUser.mockResolvedValue(userRow());

    await controller.create(dto as never, avatar, 'ar');

    expect(iam.createUser).toHaveBeenCalledWith(dto, avatar, 'ar');
  });

  it('list maps each row to UserResponseDto and keeps the meta', async () => {
    const query = { page: 1, limit: 20 };
    iam.listUsers.mockResolvedValue({
      data: [userRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    const result = await controller.list(query as never);

    expect(iam.listUsers).toHaveBeenCalledWith(query);
    expect(result.data[0]).toBeInstanceOf(UserResponseDto);
    expect(result.data[0]).not.toHaveProperty('hashed_password');
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it('getById delegates to findById', async () => {
    iam.getUser.mockResolvedValue(userRow());

    const result = await controller.getById('user-1');

    expect(result).toBeInstanceOf(UserResponseDto);
    expect(result).toMatchObject({ id: 'user-1' });
    expect(result).not.toHaveProperty('hashed_password');
    expect(iam.getUser).toHaveBeenCalledWith('user-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    iam.updateUser.mockResolvedValue(userRow());

    await controller.update('user-1', dto as never);

    expect(iam.updateUser).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('update forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    iam.updateUser.mockResolvedValue(userRow());

    await controller.update('user-1', dto as never, avatar);

    expect(iam.updateUser).toHaveBeenCalledWith('user-1', dto, avatar);
  });

  it('delete returns no body', async () => {
    iam.deleteUser.mockResolvedValue(undefined);

    await expect(controller.delete('user-1')).resolves.toBeUndefined();
    expect(iam.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('getMe resolves the profile through the token-derived user id', async () => {
    iam.getUser.mockResolvedValue(userRow());

    await controller.getMe(REQUEST_USER);

    expect(iam.getUser).toHaveBeenCalledWith('user-1');
  });

  it('updateMe updates the token-derived user, never a path id', async () => {
    const dto = { name: 'New Name' };
    iam.updateUser.mockResolvedValue(userRow());

    await controller.updateMe(REQUEST_USER, dto as never);

    expect(iam.updateUser).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('updateMe forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    iam.updateUser.mockResolvedValue(userRow());

    await controller.updateMe(REQUEST_USER, dto as never, avatar);

    expect(iam.updateUser).toHaveBeenCalledWith('user-1', dto, avatar);
  });

  it('assignGroup returns the updated user', async () => {
    iam.assignGroup.mockResolvedValue(
      userRow({
        group_id: 'group-1',
        group: {
          id: 'group-1',
          name: 'Support',
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    );

    const result = await controller.assignGroup('user-1', {
      group_id: 'group-1',
    });

    expect(result).toBeInstanceOf(UserResponseDto);
    expect({ ...result.group }).toEqual({ id: 'group-1', name: 'Support' });
    expect(iam.assignGroup).toHaveBeenCalledWith('user-1', 'group-1');
  });
});
