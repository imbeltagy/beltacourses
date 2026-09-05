import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import {
  AccessTokenGuard,
  PermissionsGuard,
  RolesGuard,
} from '@repo/service/core';
import type { RequestUser } from '@repo/service/core';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';

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
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
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
    usersService.create.mockResolvedValue({ id: '1' });

    await expect(controller.create(dto as never)).resolves.toEqual({ id: '1' });
    expect(usersService.create).toHaveBeenCalledWith(dto, undefined);
  });

  it('create forwards the uploaded avatar file to the service', async () => {
    const dto = { email: 'a@example.com', password: 'password', name: 'A' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.create.mockResolvedValue({ id: '1' });

    await controller.create(dto as never, avatar);

    expect(usersService.create).toHaveBeenCalledWith(dto, avatar);
  });

  it('list delegates to the service', async () => {
    const query = { page: 1, limit: 20 };
    usersService.list.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    await controller.list(query as never);

    expect(usersService.list).toHaveBeenCalledWith(query);
  });

  it('getById delegates to findById', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1' });

    await expect(controller.getById('user-1')).resolves.toEqual({
      id: 'user-1',
    });
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('update delegates to the service with the path id', async () => {
    const dto = { name: 'New Name' };
    usersService.update.mockResolvedValue({ id: 'user-1', name: 'New Name' });

    await controller.update('user-1', dto as never);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('update forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.update.mockResolvedValue({ id: 'user-1' });

    await controller.update('user-1', dto as never, avatar);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, avatar);
  });

  it('delete returns no body', async () => {
    usersService.softDelete.mockResolvedValue(undefined);

    await expect(controller.delete('user-1')).resolves.toBeUndefined();
    expect(usersService.softDelete).toHaveBeenCalledWith('user-1');
  });

  it('getMe resolves the profile through the token-derived user id', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1' });

    await controller.getMe(REQUEST_USER);

    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('updateMe updates the token-derived user, never a path id', async () => {
    const dto = { name: 'New Name' };
    usersService.update.mockResolvedValue({ id: 'user-1', name: 'New Name' });

    await controller.updateMe(REQUEST_USER, dto as never);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, undefined);
  });

  it('updateMe forwards the uploaded avatar file to the service', async () => {
    const dto = { name: 'New Name' };
    const avatar = { originalname: 'avatar.png' } as Express.Multer.File;
    usersService.update.mockResolvedValue({ id: 'user-1' });

    await controller.updateMe(REQUEST_USER, dto as never, avatar);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto, avatar);
  });
});
