import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@repo/db';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import type { PublicUser } from '../../src/users/users.types';

const publicUser = (overrides: Partial<PublicUser> = {}): PublicUser =>
  ({
    id: 'user-id',
    email: 'jane@example.com',
    name: 'Jane',
    role: Role.student,
    confirmed: false,
    bio: null,
    gender: null,
    date_of_birth: null,
    avatar_id: null,
    created_at: new Date('2026-08-01T00:00:00.000Z'),
    updated_at: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  }) as PublicUser;

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    verifyCredentials: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      verifyCredentials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  const uploaded = (): Express.Multer.File =>
    ({
      buffer: Buffer.from('png-bytes'),
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 9,
    }) as Express.Multer.File;

  describe('create', () => {
    const dto = {
      email: 'jane@example.com',
      password: 'super-secret',
      name: 'Jane',
    };

    it('passes the body through and returns the user', async () => {
      const user = publicUser();
      usersService.create.mockResolvedValue(user);

      await expect(controller.create(dto)).resolves.toBe(user);
      expect(usersService.create).toHaveBeenCalledWith(dto, undefined);
    });

    it('hands the uploaded avatar to the service', async () => {
      usersService.create.mockResolvedValue(publicUser());
      const file = uploaded();

      await controller.create(dto, file);

      expect(usersService.create).toHaveBeenCalledWith(dto, file);
    });
  });

  describe('list', () => {
    it('passes the query through and returns the page', async () => {
      const page = { items: [publicUser()], total: 1, page: 1, limit: 20 };
      usersService.list.mockResolvedValue(page);
      const query = { page: 1, limit: 20, role: Role.teacher };

      await expect(controller.list(query)).resolves.toBe(page);
      expect(usersService.list).toHaveBeenCalledWith(query);
    });
  });

  describe('findById', () => {
    it('delegates to the service', async () => {
      const user = publicUser();
      usersService.findById.mockResolvedValue(user);

      await expect(controller.findById('user-id')).resolves.toBe(user);
      expect(usersService.findById).toHaveBeenCalledWith('user-id');
    });

    it('lets a NotFoundException propagate', async () => {
      usersService.findById.mockRejectedValue(
        new NotFoundException('User x not found'),
      );

      await expect(controller.findById('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('passes the id and body through', async () => {
      const user = publicUser({ name: 'New' });
      usersService.update.mockResolvedValue(user);

      await expect(controller.update('user-id', { name: 'New' })).resolves.toBe(
        user,
      );
      expect(usersService.update).toHaveBeenCalledWith(
        'user-id',
        { name: 'New' },
        undefined,
      );
    });

    it('hands the replacement avatar to the service', async () => {
      usersService.update.mockResolvedValue(publicUser());
      const file = uploaded();

      await controller.update('user-id', {}, file);

      expect(usersService.update).toHaveBeenCalledWith('user-id', {}, file);
    });
  });

  describe('softDelete', () => {
    it('delegates and returns no body', async () => {
      usersService.softDelete.mockResolvedValue(undefined);

      await expect(controller.softDelete('user-id')).resolves.toBeUndefined();
      expect(usersService.softDelete).toHaveBeenCalledWith('user-id');
    });
  });

  describe('HTTP surface', () => {
    it('exposes exactly the five CRUD handlers — no /users/me yet', () => {
      const handlers = Object.getOwnPropertyNames(
        UsersController.prototype,
      ).sort();

      expect(handlers).toEqual(
        [
          'constructor',
          'create',
          'findById',
          'list',
          'softDelete',
          'update',
        ].sort(),
      );
    });
  });
});
