import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@repo/db';
import { PasswordService, TokenService } from '@repo/service/core';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findById: jest.Mock;
  };
  let passwordService: { compare: jest.Mock };
  let tokenService: { sign: jest.Mock };

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
    };
    passwordService = { compare: jest.fn() };
    tokenService = { sign: jest.fn() };
    service = new AuthService(
      usersService as unknown as UsersService,
      passwordService as unknown as PasswordService,
      tokenService as unknown as TokenService,
    );
  });

  describe('register', () => {
    it('forces confirmed: false and passes the chosen role through', async () => {
      usersService.create.mockResolvedValue({ id: 'user-1' });

      await service.register({
        email: 'a@example.com',
        password: 'password',
        name: 'A',
        role: Role.teacher,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.teacher, confirmed: false }),
        undefined,
      );
    });

    it('ignores a smuggled confirmed: true on the body', async () => {
      usersService.create.mockResolvedValue({ id: 'user-1' });

      await service.register({
        email: 'a@example.com',
        password: 'password',
        name: 'A',
        role: Role.student,
        // @ts-expect-error — not part of RegisterDto, simulating a smuggled field
        confirmed: true,
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ confirmed: false }),
        undefined,
      );
    });

    it('forwards the uploaded avatar file to UsersService', async () => {
      usersService.create.mockResolvedValue({ id: 'user-1' });
      const avatar = { originalname: 'avatar.png' } as Express.Multer.File;

      await service.register(
        {
          email: 'a@example.com',
          password: 'password',
          name: 'A',
          role: Role.student,
        },
        avatar,
      );

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@example.com' }),
        avatar,
      );
    });
  });

  describe('login', () => {
    it('signs an access token for the verified user', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue({ id: 'user-1' });
      tokenService.sign.mockReturnValue('signed-token');

      const result = await service.login({
        email: 'a@example.com',
        password: 'password',
      });

      expect(tokenService.sign).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ access_token: 'signed-token' });
    });

    it('propagates the 401 from verifyCredentials', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'a@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(tokenService.sign).not.toHaveBeenCalled();
    });
  });

  describe('verifyCredentials', () => {
    it('returns the public profile on success', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      const publicUser = { id: 'user-1', email: 'student@beltacourses.com' };
      usersService.findById.mockResolvedValue(publicUser);

      await expect(
        service.verifyCredentials(
          'student@beltacourses.com',
          'plaintext-password',
        ),
      ).resolves.toBe(publicUser);
      expect(passwordService.compare).toHaveBeenCalledWith(
        'plaintext-password',
        'hashed-value',
      );
    });

    it('throws the same 401 for an unknown email', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.verifyCredentials('unknown@example.com', 'whatever'),
      ).rejects.toThrow(UnauthorizedException);
      expect(passwordService.compare).not.toHaveBeenCalled();
    });

    it('throws the same 401 for a wrong password', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(false);

      await expect(
        service.verifyCredentials('student@beltacourses.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findById).not.toHaveBeenCalled();
    });
  });
});
