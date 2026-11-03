import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@repo/db';
import { AppException, ErrorCode } from '@repo/backend/errors';
import type { SessionService } from '../../../src/iam/auth/session.service';
import type { TokensUtil } from '../../../src/iam/auth/tokens.util';
import { AUTH_OPTIONS_KEY } from '../../../src/iam/constants/iam.constants';
import { AuthGuard } from '../../../src/iam/guards/auth.guard';
import type {
  AccessClaims,
  AuthOptions,
  Session,
} from '../../../src/iam/types/iam.types';
import { errorWith } from '../../helpers/error-with';

class Controller {
  route() {}
}

function contextFor(header?: string): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; user?: unknown };
} {
  const request = { headers: { authorization: header } };
  const context = {
    getHandler: () => Controller.prototype.route,
    getClass: () => Controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

const claims = (
  role: Role,
  over: Partial<AccessClaims> = {},
): AccessClaims => ({
  sub: 'user-1',
  sid: 'sid-1',
  role,
  email: 'u@example.com',
  name: 'U',
  iss: 'iss',
  aud: 'aud',
  iat: 0,
  exp: 0,
  ...over,
});

const session = (over: Partial<Session> = {}): Session => ({
  userId: 'user-1',
  role: Role.admin,
  groupId: 'group-1',
  permissions: ['users:read'],
  hashedRefreshToken: 'h',
  ...over,
});

describe('AuthGuard', () => {
  let options: AuthOptions | undefined;
  let tokens: { verifyAccess: jest.Mock };
  let sessions: { get: jest.Mock };
  let guard: AuthGuard;

  beforeEach(() => {
    options = { public: false };
    tokens = { verifyAccess: jest.fn() };
    sessions = { get: jest.fn() };
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === AUTH_OPTIONS_KEY ? options : undefined,
      ),
    } as unknown as Reflector;
    guard = new AuthGuard(
      reflector,
      tokens as unknown as TokensUtil,
      sessions as unknown as SessionService,
    );
  });

  it('throws a plain Error when @Auth metadata is missing', async () => {
    options = undefined;
    const { context } = contextFor('Bearer t');

    const promise = guard.canActivate(context);

    await expect(promise).rejects.toThrow(/Missing @Auth\(\)/);
    await expect(promise).rejects.not.toHaveProperty('error');
  });

  it('lets a public route through with user null and ignores the token', async () => {
    options = { public: true };
    const { context, request } = contextFor('Bearer garbage');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeNull();
    expect(tokens.verifyAccess).not.toHaveBeenCalled();
  });

  it('rejects a missing or non-Bearer header', async () => {
    await expect(guard.canActivate(contextFor().context)).rejects.toThrow(
      errorWith(ErrorCode.MISSING_ACCESS_TOKEN),
    );
    await expect(
      guard.canActivate(contextFor('Basic abc').context),
    ).rejects.toThrow(errorWith(ErrorCode.MISSING_ACCESS_TOKEN));
  });

  it('propagates INVALID_ACCESS_TOKEN from verification', async () => {
    tokens.verifyAccess.mockImplementation(() => {
      throw new AppException(ErrorCode.INVALID_ACCESS_TOKEN);
    });

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.INVALID_ACCESS_TOKEN));
  });

  it('403s when the role is not allowed, before touching Redis', async () => {
    options = { roles: [Role.admin, Role.super_admin] };
    tokens.verifyAccess.mockReturnValue(claims(Role.student));

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.FORBIDDEN));
    expect(sessions.get).not.toHaveBeenCalled();
  });

  it('passes a client with no Redis lookup and empty permissions', async () => {
    tokens.verifyAccess.mockReturnValue(claims(Role.student));
    const { context, request } = contextFor('Bearer t');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(sessions.get).not.toHaveBeenCalled();
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'u@example.com',
      name: 'U',
      role: Role.student,
      sid: 'sid-1',
      groupId: null,
      permissions: [],
    });
  });

  it('403s a client on a permissions-only route', async () => {
    options = { permissions: 'users:read' };
    tokens.verifyAccess.mockReturnValue(claims(Role.teacher));

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.FORBIDDEN));
  });

  it('401s SESSION_EXPIRED when a moderator has no session', async () => {
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(null);

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.SESSION_EXPIRED));
    expect(sessions.get).toHaveBeenCalledWith('sid-1');
  });

  it('401s SESSION_EXPIRED when the session belongs to another user', async () => {
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(session({ userId: 'someone-else' }));

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.SESSION_EXPIRED));
  });

  it('passes an admin holding the permissions and fills groupId/permissions from the session', async () => {
    options = { permissions: 'users:read' };
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(session());
    const { context, request } = contextFor('Bearer t');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({
      role: Role.admin,
      groupId: 'group-1',
      permissions: ['users:read'],
    });
  });

  it('403s an admin missing a required permission', async () => {
    options = { permissions: ['users:read', 'users:delete'] };
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(session());

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).rejects.toThrow(errorWith(ErrorCode.FORBIDDEN));
  });

  it('honours wildcard permissions from the session', async () => {
    options = { permissions: 'users:delete' };
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(session({ permissions: ['users:*'] }));

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).resolves.toBe(true);
  });

  it('lets an admin with no group through a route that needs no permissions', async () => {
    options = { roles: Role.admin };
    tokens.verifyAccess.mockReturnValue(claims(Role.admin));
    sessions.get.mockResolvedValue(session({ groupId: null, permissions: [] }));

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).resolves.toBe(true);
  });

  it('lets super_admin bypass permissions', async () => {
    options = {
      roles: [Role.admin, Role.super_admin],
      permissions: 'users:delete',
    };
    tokens.verifyAccess.mockReturnValue(claims(Role.super_admin));
    sessions.get.mockResolvedValue(
      session({ role: Role.super_admin, groupId: null, permissions: [] }),
    );

    await expect(
      guard.canActivate(contextFor('Bearer t').context),
    ).resolves.toBe(true);
  });
});
