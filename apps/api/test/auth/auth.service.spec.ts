import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@repo/db';
import {
  PasswordService,
  SessionService,
  TokenService,
} from '@repo/service/core';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';

const clientUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane Doe',
  role: Role.student,
  ...overrides,
});

const moderatorUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'admin-1',
  email: 'admin@beltacourses.com',
  name: 'Admin Doe',
  role: Role.admin,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findById: jest.Mock;
  };
  let passwordService: { compare: jest.Mock };
  let tokenService: {
    signPair: jest.Mock;
    signAccessToken: jest.Mock;
    signRefreshToken: jest.Mock;
    verifyRefreshToken: jest.Mock;
    accessTokenTtl: jest.Mock;
  };
  let sessionService: {
    saveSession: jest.Mock;
    verifySession: jest.Mock;
    removeSession: jest.Mock;
    removeAllUserSessions: jest.Mock;
  };

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
    };
    passwordService = { compare: jest.fn() };
    tokenService = {
      signPair: jest.fn(),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      accessTokenTtl: jest.fn().mockReturnValue(1800),
    };
    sessionService = {
      saveSession: jest.fn().mockResolvedValue(undefined),
      verifySession: jest.fn(),
      removeSession: jest.fn().mockResolvedValue(undefined),
      removeAllUserSessions: jest.fn(),
    };
    service = new AuthService(
      usersService as unknown as UsersService,
      passwordService as unknown as PasswordService,
      tokenService as unknown as TokenService,
      sessionService as unknown as SessionService,
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

  describe('verifyCredentials', () => {
    it('returns the public profile on success', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      const publicUser = clientUser();
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

  describe('login', () => {
    it('rejects a moderator with the generic 401', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'admin-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(moderatorUser());

      await expect(
        service.login({
          email: 'admin@beltacourses.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(tokenService.signPair).not.toHaveBeenCalled();
    });

    it('signs a stateless pair for a client with no Redis call', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(clientUser());
      tokenService.signPair.mockReturnValue({
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 1800,
      });

      const result = await service.login({
        email: 'student@beltacourses.com',
        password: 'password',
      });

      expect(result).toEqual({
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 1800,
      });
      expect(sessionService.saveSession).not.toHaveBeenCalled();
    });
  });

  describe('loginModerator', () => {
    it('rejects a client with the generic 401', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(clientUser());

      await expect(
        service.loginModerator({
          email: 'student@beltacourses.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(sessionService.saveSession).not.toHaveBeenCalled();
    });

    it('generates a sid, signs both tokens with it, and saves the session before returning', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'admin-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(moderatorUser());
      tokenService.signRefreshToken.mockReturnValue('refresh-token');
      tokenService.signAccessToken.mockReturnValue('access-token');

      const callOrder: string[] = [];
      tokenService.signRefreshToken.mockImplementation(() => {
        callOrder.push('signRefreshToken');
        return 'refresh-token';
      });
      sessionService.saveSession.mockImplementation(() => {
        callOrder.push('saveSession');
        return Promise.resolve();
      });
      tokenService.signAccessToken.mockImplementation(() => {
        callOrder.push('signAccessToken');
        return 'access-token';
      });

      const result = await service.loginModerator({
        email: 'admin@beltacourses.com',
        password: 'password',
      });

      expect(callOrder).toEqual([
        'signRefreshToken',
        'saveSession',
        'signAccessToken',
      ]);

      const [, sidUsedForRefresh] = tokenService.signRefreshToken.mock
        .calls[0] as [unknown, string];
      const [, sidUsedForAccess] = tokenService.signAccessToken.mock
        .calls[0] as [unknown, string];
      expect(sidUsedForRefresh).toBe(sidUsedForAccess);

      const [userId, sid, refreshToken] = sessionService.saveSession.mock
        .calls[0] as [string, string, string];
      expect(userId).toBe('admin-1');
      expect(sid).toBe(sidUsedForRefresh);
      expect(refreshToken).toBe('refresh-token');

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 1800,
      });
    });

    it('returns no tokens when saveSession fails', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 'admin-1',
        hashed_password: 'hashed-value',
      });
      passwordService.compare.mockResolvedValue(true);
      usersService.findById.mockResolvedValue(moderatorUser());
      tokenService.signRefreshToken.mockReturnValue('refresh-token');
      sessionService.saveSession.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.loginModerator({
          email: 'admin@beltacourses.com',
          password: 'password',
        }),
      ).rejects.toThrow('ECONNREFUSED');
      expect(tokenService.signAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('returns a new access token for a client with no Redis call', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-1',
        typ: 'refresh',
      });
      usersService.findById.mockResolvedValue(clientUser());
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh('a-refresh-token');

      expect(result).toEqual({
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 1800,
      });
      expect(sessionService.verifySession).not.toHaveBeenCalled();
    });

    it('verifies the session and reuses the same sid for a moderator', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'admin-1',
        sid: 'sid-1',
        typ: 'refresh',
      });
      usersService.findById.mockResolvedValue(moderatorUser());
      sessionService.verifySession.mockResolvedValue(true);
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh('a-refresh-token');

      expect(sessionService.verifySession).toHaveBeenCalledWith(
        'admin-1',
        'sid-1',
        'a-refresh-token',
      );
      expect(tokenService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'admin-1' }),
        'sid-1',
      );
      expect(result).toEqual({
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 1800,
      });
    });

    it('401s on a hash mismatch (verifySession false)', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'admin-1',
        sid: 'sid-1',
        typ: 'refresh',
      });
      usersService.findById.mockResolvedValue(moderatorUser());
      sessionService.verifySession.mockResolvedValue(false);

      await expect(service.refresh('a-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('401s a moderator token with no sid claim', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'admin-1',
        typ: 'refresh',
      });
      usersService.findById.mockResolvedValue(moderatorUser());

      await expect(service.refresh('a-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionService.verifySession).not.toHaveBeenCalled();
    });

    it('401s a soft-deleted or unknown user (NotFoundException mapped to 401)', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'unknown',
        typ: 'refresh',
      });
      usersService.findById.mockRejectedValue(
        new NotFoundException('User unknown not found'),
      );

      await expect(service.refresh('a-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns no refresh_token (D5)', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 'user-1',
        typ: 'refresh',
      });
      usersService.findById.mockResolvedValue(clientUser());
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh('a-refresh-token');

      expect(result).not.toHaveProperty('refresh_token');
    });
  });

  describe('logout', () => {
    it('calls removeSession for a moderator', async () => {
      await service.logout({
        id: 'admin-1',
        email: 'admin@beltacourses.com',
        name: 'Admin',
        role: Role.admin,
        sid: 'sid-1',
      });

      expect(sessionService.removeSession).toHaveBeenCalledWith(
        'admin-1',
        'sid-1',
      );
    });

    it('does nothing for a client', async () => {
      await service.logout({
        id: 'user-1',
        email: 'student@beltacourses.com',
        name: 'Jane',
        role: Role.student,
      });

      expect(sessionService.removeSession).not.toHaveBeenCalled();
    });
  });
});
