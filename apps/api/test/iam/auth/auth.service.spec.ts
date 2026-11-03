import { errorWith } from '../../helpers/error-with';
import { ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import {
  PasswordService,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import { AuthService } from '../../../src/iam/auth/auth.service';
import type { UserWithRelations } from '../../../src/iam/types/iam.types';

const clientUser = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'user-1',
    email: 'student@beltacourses.com',
    name: 'Jane Doe',
    role: Role.student,
    ...overrides,
  }) as unknown as UserWithRelations;

const moderatorUser = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'admin-1',
    email: 'admin@beltacourses.com',
    name: 'Admin Doe',
    role: Role.admin,
    ...overrides,
  }) as unknown as UserWithRelations;

describe('AuthService', () => {
  let service: AuthService;
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
      passwordService as unknown as PasswordService,
      tokenService as unknown as TokenService,
      sessionService as unknown as SessionService,
    );
  });

  describe('verifyPassword', () => {
    it('resolves when the password matches the hash', async () => {
      passwordService.compare.mockResolvedValue(true);

      await expect(
        service.verifyPassword('plaintext-password', 'hashed-value'),
      ).resolves.toBeUndefined();
      expect(passwordService.compare).toHaveBeenCalledWith(
        'plaintext-password',
        'hashed-value',
      );
    });

    it('throws the generic 401 for a wrong password', async () => {
      passwordService.compare.mockResolvedValue(false);

      await expect(
        service.verifyPassword('wrong-password', 'hashed-value'),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_CREDENTIALS));
    });
  });

  describe('issueTokens (client login)', () => {
    it('rejects a moderator with the generic 401', async () => {
      await expect(service.issueTokens(moderatorUser(), false)).rejects.toThrow(
        errorWith(ErrorCode.INVALID_CREDENTIALS),
      );
      expect(tokenService.signPair).not.toHaveBeenCalled();
    });

    it('signs a stateless pair for a client with no Redis call', async () => {
      tokenService.signPair.mockReturnValue({
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 1800,
      });

      const result = await service.issueTokens(clientUser(), false);

      expect(result).toEqual({
        access_token: 'access',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 1800,
      });
      expect(sessionService.saveSession).not.toHaveBeenCalled();
    });
  });

  describe('issueTokens (moderator login)', () => {
    it('rejects a client with the generic 401', async () => {
      await expect(service.issueTokens(clientUser(), true)).rejects.toThrow(
        errorWith(ErrorCode.INVALID_CREDENTIALS),
      );
      expect(sessionService.saveSession).not.toHaveBeenCalled();
    });

    it('generates a sid, signs both tokens with it, and saves the session before returning', async () => {
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

      const result = await service.issueTokens(moderatorUser(), true);

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
      tokenService.signRefreshToken.mockReturnValue('refresh-token');
      sessionService.saveSession.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.issueTokens(moderatorUser(), true)).rejects.toThrow(
        'ECONNREFUSED',
      );
      expect(tokenService.signAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    it('delegates to the token service', () => {
      const claims = { sub: 'user-1', typ: 'refresh' };
      tokenService.verifyRefreshToken.mockReturnValue(claims);

      expect(service.verifyRefreshToken('a-refresh-token')).toBe(claims);
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        'a-refresh-token',
      );
    });
  });

  describe('refresh', () => {
    const clientClaims = { sub: 'user-1', typ: 'refresh' } as never;

    it('returns a new access token for a client with no Redis call', async () => {
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh(
        clientClaims,
        'a-refresh-token',
        clientUser(),
      );

      expect(result).toEqual({
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 1800,
      });
      expect(sessionService.verifySession).not.toHaveBeenCalled();
    });

    it('verifies the session and reuses the same sid for a moderator', async () => {
      const claims = { sub: 'admin-1', sid: 'sid-1', typ: 'refresh' } as never;
      sessionService.verifySession.mockResolvedValue(true);
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh(
        claims,
        'a-refresh-token',
        moderatorUser(),
      );

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
      const claims = { sub: 'admin-1', sid: 'sid-1', typ: 'refresh' } as never;
      sessionService.verifySession.mockResolvedValue(false);

      await expect(
        service.refresh(claims, 'a-refresh-token', moderatorUser()),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
    });

    it('401s a moderator token with no sid claim', async () => {
      const claims = { sub: 'admin-1', typ: 'refresh' } as never;

      await expect(
        service.refresh(claims, 'a-refresh-token', moderatorUser()),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
      expect(sessionService.verifySession).not.toHaveBeenCalled();
    });

    it('returns no refresh_token (D5)', async () => {
      tokenService.signAccessToken.mockReturnValue('new-access-token');

      const result = await service.refresh(
        clientClaims,
        'a-refresh-token',
        clientUser(),
      );

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

  describe('revokeAllSessions', () => {
    it('removes every session of the user', async () => {
      sessionService.removeAllUserSessions.mockResolvedValue(2);

      await expect(service.revokeAllSessions('admin-1')).resolves.toBe(2);
      expect(sessionService.removeAllUserSessions).toHaveBeenCalledWith(
        'admin-1',
      );
    });
  });
});
