import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from '../../../src/core/guards/access-token.guard';
import { TokenService } from '../../../src/core/token.service';
import { UsersRepository } from '../../../src/core/users.repository';

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
  let tokenService: { verify: jest.Mock };
  let usersRepository: { findById: jest.Mock };
  let guard: AccessTokenGuard;

  beforeEach(() => {
    tokenService = { verify: jest.fn() };
    usersRepository = { findById: jest.fn() };
    guard = new AccessTokenGuard(
      tokenService as unknown as TokenService,
      usersRepository as unknown as UsersRepository,
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

  it('rejects a token whose user no longer exists', async () => {
    const { context } = contextWithAuthHeader('Bearer a-token');
    tokenService.verify.mockReturnValue('user-1');
    usersRepository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches only the user id and allows the request through', async () => {
    const { context, request } = contextWithAuthHeader('Bearer a-token');
    tokenService.verify.mockReturnValue('user-1');
    usersRepository.findById.mockResolvedValue({ id: 'user-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });
});
