import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Role } from '@repo/db';
import { AccessTokenGuard } from '../../../src/core/guards/access-token.guard';
import { SessionService } from '../../../src/core/session.service';
import { TokenService } from '../../../src/core/token.service';

function contextWithAuthHeader(header?: string): {
  context: ExecutionContext;
  request: { headers: Record<string, string | undefined>; user?: unknown };
} {
  const request = {
    headers: { authorization: header } as Record<string, string | undefined>,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('AccessTokenGuard', () => {
  let tokenService: { verifyAccessToken: jest.Mock };
  let sessionService: { hasSession: jest.Mock };
  let guard: AccessTokenGuard;

  beforeEach(() => {
    tokenService = { verifyAccessToken: jest.fn() };
    sessionService = { hasSession: jest.fn() };
    guard = new AccessTokenGuard(
      tokenService as unknown as TokenService,
      sessionService as unknown as SessionService,
    );
  });

  it('rejects a request with no Authorization header', async () => {
    const { context } = contextWithAuthHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a non-Bearer Authorization header', async () => {
    const { context } = contextWithAuthHeader('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid token', async () => {
    const { context } = contextWithAuthHeader('Bearer a-token');
    tokenService.verifyAccessToken.mockImplementation(() => {
      throw new UnauthorizedException('Invalid access token');
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('passes a client token with no Redis call at all', async () => {
    const { context, request } = contextWithAuthHeader('Bearer a-token');
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-1',
      email: 'a@example.com',
      name: 'A',
      role: Role.student,
      typ: 'access',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(sessionService.hasSession).not.toHaveBeenCalled();
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'a@example.com',
      name: 'A',
      role: Role.student,
    });
  });

  it('passes a moderator token with a live session', async () => {
    const { context, request } = contextWithAuthHeader('Bearer a-token');
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      sid: 'sid-1',
      typ: 'access',
    });
    sessionService.hasSession.mockResolvedValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(sessionService.hasSession).toHaveBeenCalledWith('admin-1', 'sid-1');
    expect(request.user).toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      sid: 'sid-1',
    });
  });

  it('rejects a moderator token when the session is gone', async () => {
    const { context } = contextWithAuthHeader('Bearer a-token');
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      sid: 'sid-1',
      typ: 'access',
    });
    sessionService.hasSession.mockResolvedValue(false);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a moderator token missing sid', async () => {
    const { context } = contextWithAuthHeader('Bearer a-token');
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: Role.admin,
      typ: 'access',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessionService.hasSession).not.toHaveBeenCalled();
  });
});
