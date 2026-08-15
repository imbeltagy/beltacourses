import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { HTTP_CODE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
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

/**
 * Reads the handler off the prototype descriptor rather than as
 * `AuthController.prototype.login`, which lint flags as an unbound method.
 */
const handler = (name: 'login' | 'register'): object =>
  Object.getOwnPropertyDescriptor(AuthController.prototype, name)
    ?.value as object;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  const credentials = { email: 'jane@example.com', password: 'super-secret' };

  describe('register', () => {
    it('delegates the body and returns the user', async () => {
      const user = publicUser();
      authService.register.mockResolvedValue(user);
      const dto = { ...credentials, name: 'Jane' };

      await expect(controller.register(dto)).resolves.toBe(user);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates the body and returns the user', async () => {
      const user = publicUser();
      authService.login.mockResolvedValue(user);

      await expect(controller.login(credentials)).resolves.toBe(user);
      expect(authService.login).toHaveBeenCalledWith(credentials);
    });

    it('propagates the 401', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(controller.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('answers 200, not the 201 Nest defaults POST to', () => {
      const status: unknown = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        handler('login'),
      );

      expect(status).toBe(200);
    });

    it('leaves register on the default 201', () => {
      const status: unknown = Reflect.getMetadata(
        HTTP_CODE_METADATA,
        handler('register'),
      );

      expect(status).toBeUndefined();
    });
  });

  describe('HTTP surface', () => {
    it('mounts both routes under /auth', () => {
      const prefix: unknown = Reflect.getMetadata(
        PATH_METADATA,
        AuthController,
      );

      expect(prefix).toBe('auth');
      expect(
        Object.getOwnPropertyNames(AuthController.prototype).sort(),
      ).toEqual(['constructor', 'login', 'register']);
    });
  });
});
