import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import {
  AccessTokenGuard,
  PermissionsGuard,
  RolesGuard,
} from '@repo/backend/core';
import type { RequestUser } from '@repo/backend/core';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UserResponseDto } from '../../src/users/dto/response/user.dto';
import { userRow } from '../helpers/rows';

const REQUEST_USER: RequestUser = {
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane',
  role: Role.student,
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    assignGroup: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      assignGroup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
  });

  it('create delegates to the service', async () => {
    const dto = { email: 'a@example.com', password: 'password', name: 'A' };
    usersService.create.mockResolvedValue(userRow());

    await expect(
      controller.create(dto as never, undefined, 'en'),
    ).resolves.toBeInstanceOf(UserResponseDto);
    expect(usersService.create).toHaveBeenCalledWith(dto, undefined, 'en');
  });

  it('create forwards the uploaded avatar file to the service', async () => {
    const dto = { email: 'a@example.com', password: 'password', name: 'A' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.create.mockResolvedValue(userRow());

    await controller.create(dto as never, avatar, 'ar');

    expect(usersService.create).toHaveBeenCalledWith(dto, avatar, 'ar');
  });

  it('list maps each row to UserResponseDto and keeps the meta', async () => {
    const query = { page: 1, limit: 20 };
    usersService.list.mockResolvedValue({
      data: [userRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    const result = await controller.list(query as never);

    expect(usersService.list).toHaveBeenCalledWith(query);
    expect(result.data[0]).toBeInstanceOf(UserResponseDto);
    expect(result.data[0]).not.toHaveProperty('hashed_password');
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it('getById delegates to findById', async () => {
    usersService.findById.mockResolvedValue(userRow());

    const result = await controller.getById('user-1');

    expect(result).toBeInstanceOf(UserResponseDto);
    expect(result).toMatchObject({ id: 'user-1' });
    expect(result).not.toHaveProperty('hashed_password');
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    usersService.update.mockResolvedValue(userRow());

    await controller.update('user-1', dto as never);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('update forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.update.mockResolvedValue(userRow());

    await controller.update('user-1', dto as never, avatar);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, avatar);
  });

  it('delete returns no body', async () => {
    usersService.softDelete.mockResolvedValue(undefined);

    await expect(controller.delete('user-1')).resolves.toBeUndefined();
    expect(usersService.softDelete).toHaveBeenCalledWith('user-1');
  });

  it('getMe resolves the profile through the token-derived user id', async () => {
    usersService.findById.mockResolvedValue(userRow());

    await controller.getMe(REQUEST_USER);

    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('updateMe updates the token-derived user, never a path id', async () => {
    const dto = { name: 'New Name' };
    usersService.update.mockResolvedValue(userRow());

    await controller.updateMe(REQUEST_USER, dto as never);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('updateMe forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.update.mockResolvedValue(userRow());

    await controller.updateMe(REQUEST_USER, dto as never, avatar);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, avatar);
  });

  it('assignGroup returns the updated user', async () => {
    usersService.assignGroup.mockResolvedValue(
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
    expect(usersService.assignGroup).toHaveBeenCalledWith('user-1', 'group-1');
  });
});
