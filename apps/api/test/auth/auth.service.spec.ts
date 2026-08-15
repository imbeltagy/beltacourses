import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/db';
import { AuthService } from '../../src/auth/auth.service';
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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { create: jest.Mock; verifyCredentials: jest.Mock };

  beforeEach(async () => {
    usersService = { create: jest.fn(), verifyCredentials: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  const registerDto = {
    email: 'jane@example.com',
    password: 'super-secret',
    name: 'Jane',
  };

  describe('register', () => {
    it('creates an unconfirmed student', async () => {
      usersService.create.mockResolvedValue(publicUser());

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'super-secret',
        name: 'Jane',
        role: Role.student,
        confirmed: false,
      });
    });

    it('ignores a role or confirmed smuggled into the body', async () => {
      usersService.create.mockResolvedValue(publicUser());
      const smuggled = {
        ...registerDto,
        role: Role.super_admin,
        confirmed: true,
      } as typeof registerDto;

      await service.register(smuggled);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.student, confirmed: false }),
      );
    });

    it('propagates a duplicate-email conflict', async () => {
      usersService.create.mockRejectedValue(new Error('Email already in use'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already in use',
      );
    });
  });

  describe('login', () => {
    it('returns the profile verifyCredentials resolved with', async () => {
      const user = publicUser();
      usersService.verifyCredentials.mockResolvedValue(user);

      await expect(
        service.login({ email: 'jane@example.com', password: 'super-secret' }),
      ).resolves.toBe(user);
      expect(usersService.verifyCredentials).toHaveBeenCalledWith(
        'jane@example.com',
        'super-secret',
      );
    });

    it('propagates the 401 unchanged', async () => {
      usersService.verifyCredentials.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('logs in an unconfirmed user — the gate arrives with the email service', async () => {
      const unconfirmed = publicUser({ confirmed: false });
      usersService.verifyCredentials.mockResolvedValue(unconfirmed);

      await expect(
        service.login({ email: 'jane@example.com', password: 'super-secret' }),
      ).resolves.toBe(unconfirmed);
    });
  });
});
