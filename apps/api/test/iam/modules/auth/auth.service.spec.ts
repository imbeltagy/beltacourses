import { errorWith } from '../../../helpers/error-with';
import { ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import { AuthService } from '../../../../src/iam/modules/auth/auth.service';
import type { PasswordService } from '../../../../src/iam/modules/auth/password.service';
import type { SessionService } from '../../../../src/iam/modules/auth/session.service';
import type { TokensUtil } from '../../../../src/iam/modules/auth/tokens.util';
import type { UserWithRelations } from '../../../../src/iam/types/iam.types';

const clientUser = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'user-1',
    email: 'student@beltacourses.com',
    name: 'Jane Doe',
    role: Role.student,
    group_id: null,
    ...overrides,
  }) as unknown as UserWithRelations;

const moderatorUser = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'admin-1',
    email: 'admin@beltacourses.com',
    name: 'Admin Doe',
    role: Role.admin,
    group_id: 'group-1',
    ...overrides,
  }) as unknown as UserWithRelations;

const PAIR = {
  access_token: 'access',
  refresh_token: 'refresh',
  token_type: 'Bearer' as const,
  expires_in: 300,
  refresh_expires_in: 36000,
};

describe('AuthService', () => {
  let service: AuthService;
  let passwordService: { compare: jest.Mock };
  let tokensUtil: {
    signPair: jest.Mock;
    verifyRefresh: jest.Mock;
    kindOf: jest.Mock;
    kindOfIssuer: jest.Mock;
  };
  let sessionService: {
    create: jest.Mock;
    get: jest.Mock;
    rotate: jest.Mock;
    remove: jest.Mock;
    hash: jest.Mock;
    verifyHash: jest.Mock;
  };

  beforeEach(() => {
    passwordService = { compare: jest.fn() };
    tokensUtil = {
      signPair: jest.fn().mockReturnValue(PAIR),
      verifyRefresh: jest.fn(),
      kindOf: jest.fn(({ role }: { role: Role }) =>
        role === Role.admin || role === Role.super_admin
          ? 'moderator'
          : 'client',
      ),
      kindOfIssuer: jest.fn((iss: string) =>
        iss === 'mod-issuer' ? 'moderator' : 'client',
      ),
    };
    sessionService = {
      create: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      rotate: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      hash: jest.fn((token: string) => `hash(${token})`),
      verifyHash: jest.fn().mockReturnValue(true),
    };
    service = new AuthService(
      passwordService as unknown as PasswordService,
      tokensUtil as unknown as TokensUtil,
      sessionService as unknown as SessionService,
    );
  });

  describe('verifyPassword', () => {
    it('resolves when the password matches the hash', async () => {
      passwordService.compare.mockResolvedValue(true);

      await expect(
        service.verifyPassword('plaintext-password', 'hashed-value'),
      ).resolves.toBeUndefined();
    });

    it('throws the generic 401 for a wrong password', async () => {
      passwordService.compare.mockResolvedValue(false);

      await expect(
        service.verifyPassword('wrong-password', 'hashed-value'),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_CREDENTIALS));
    });
  });

  describe('login', () => {
    it('rejects a moderator on the client flow with the generic 401', async () => {
      await expect(
        service.login(moderatorUser(), 'client', []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_CREDENTIALS));
      expect(sessionService.create).not.toHaveBeenCalled();
    });

    it('rejects a client on the moderator flow with the generic 401', async () => {
      await expect(
        service.login(clientUser(), 'moderator', []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_CREDENTIALS));
      expect(tokensUtil.signPair).not.toHaveBeenCalled();
    });

    it('stores a session for a client too', async () => {
      const result = await service.login(clientUser(), 'client', []);

      expect(result).toBe(PAIR);
      const [sid, session] = sessionService.create.mock.calls[0] as [
        string,
        Record<string, unknown>,
      ];
      expect(tokensUtil.signPair).toHaveBeenCalledWith(clientUser(), sid);
      expect(session).toEqual({
        userId: 'user-1',
        role: Role.student,
        groupId: null,
        permissions: [],
        hashedRefreshToken: 'hash(refresh)',
      });
    });

    it('snapshots role, group and permissions for a moderator', async () => {
      await service.login(moderatorUser(), 'moderator', ['users:read']);

      expect(sessionService.create).toHaveBeenCalledWith(expect.any(String), {
        userId: 'admin-1',
        role: Role.admin,
        groupId: 'group-1',
        permissions: ['users:read'],
        hashedRefreshToken: 'hash(refresh)',
      });
    });

    it('hands out no tokens when the session cannot be stored', async () => {
      sessionService.create.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.login(moderatorUser(), 'moderator', []),
      ).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('verifyRefreshToken', () => {
    it('delegates to TokensUtil', () => {
      const claims = { sid: 's', userId: 'user-1' };
      tokensUtil.verifyRefresh.mockReturnValue(claims);

      expect(service.verifyRefreshToken('a-refresh-token')).toBe(claims);
    });
  });

  describe('refresh', () => {
    const claims = {
      sid: 'sid-1',
      userId: 'admin-1',
      iss: 'mod-issuer',
    } as never;
    const stored = {
      userId: 'admin-1',
      role: Role.admin,
      groupId: 'group-1',
      permissions: ['old'],
      hashedRefreshToken: 'hash(old-refresh)',
    };

    beforeEach(() => {
      sessionService.get.mockResolvedValue(stored);
      sessionService.rotate.mockResolvedValue(true);
    });

    it('rotates on the same sid with a fresh snapshot and returns the new pair', async () => {
      const result = await service.refresh(
        claims,
        'old-refresh',
        moderatorUser({ group_id: 'group-2' }),
        ['new'],
      );

      expect(result).toBe(PAIR);
      expect(tokensUtil.signPair).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'admin-1' }),
        'sid-1',
      );
      expect(sessionService.rotate).toHaveBeenCalledWith(
        'sid-1',
        'hash(old-refresh)',
        {
          userId: 'admin-1',
          role: Role.admin,
          groupId: 'group-2',
          permissions: ['new'],
          hashedRefreshToken: 'hash(refresh)',
        },
      );
    });

    it('works for a client session', async () => {
      sessionService.get.mockResolvedValue({
        ...stored,
        userId: 'user-1',
        role: Role.student,
      });

      await expect(
        service.refresh(
          { sid: 'sid-1', userId: 'user-1', iss: 'client-issuer' } as never,
          'old-refresh',
          clientUser(),
          [],
        ),
      ).resolves.toBe(PAIR);
    });

    it('401s when the session is gone', async () => {
      sessionService.get.mockResolvedValue(null);

      await expect(
        service.refresh(claims, 'old-refresh', moderatorUser(), []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
      expect(sessionService.rotate).not.toHaveBeenCalled();
    });

    it('401s when the session belongs to another user', async () => {
      sessionService.get.mockResolvedValue({ ...stored, userId: 'other' });

      await expect(
        service.refresh(claims, 'old-refresh', moderatorUser(), []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
    });

    it('401s on a hash mismatch', async () => {
      sessionService.verifyHash.mockReturnValue(false);

      await expect(
        service.refresh(claims, 'old-refresh', moderatorUser(), []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
      expect(sessionService.rotate).not.toHaveBeenCalled();
    });

    it('401s a token from the other login flow', async () => {
      await expect(
        service.refresh(
          claims,
          'old-refresh',
          clientUser({ id: 'admin-1' }),
          [],
        ),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
    });

    it('401s the loser of a concurrent refresh (CAS false)', async () => {
      sessionService.rotate.mockResolvedValue(false);

      await expect(
        service.refresh(claims, 'old-refresh', moderatorUser(), []),
      ).rejects.toThrow(errorWith(ErrorCode.INVALID_REFRESH_TOKEN));
    });
  });

  describe('logout', () => {
    it('removes only the caller session, for any role', async () => {
      await service.logout({ id: 'user-1', sid: 'sid-1' });

      expect(sessionService.remove).toHaveBeenCalledWith('sid-1', 'user-1');
    });
  });
});
