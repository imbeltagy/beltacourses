import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@repo/db';
import { PermissionsGuard } from '../../../src/core/guards/permissions.guard';
import { PermissionsRepository } from '../../../src/core/permissions.repository';
import { PERMISSIONS } from '../../../src/core/permissions.constants';

function contextWithUser(user?: unknown): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let permissionsRepository: { findByUserId: jest.Mock };
  let guard: PermissionsGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    permissionsRepository = { findByUserId: jest.fn() };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      permissionsRepository as unknown as PermissionsRepository,
    );
  });

  it('returns true and never calls the repository when no metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(contextWithUser({ role: Role.student })),
    ).resolves.toBe(true);
    expect(permissionsRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('returns true and never calls the repository for an empty array', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    await expect(
      guard.canActivate(contextWithUser({ role: Role.student })),
    ).resolves.toBe(true);
    expect(permissionsRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when request.user is absent', async () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.USERS_READ]);

    await expect(guard.canActivate(contextWithUser(undefined))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('refuses a client role even with permissions declared, without hitting the repository', async () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.USERS_READ]);

    await expect(
      guard.canActivate(contextWithUser({ role: Role.student })),
    ).rejects.toThrow(ForbiddenException);
    expect(permissionsRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('passes super_admin without hitting the repository', async () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.USERS_READ]);

    await expect(
      guard.canActivate(
        contextWithUser({ id: 'super-1', role: Role.super_admin }),
      ),
    ).resolves.toBe(true);
    expect(permissionsRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('passes an admin with users:* against a users:read requirement', async () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.USERS_READ]);
    permissionsRepository.findByUserId.mockResolvedValue(['users:*']);

    await expect(
      guard.canActivate(contextWithUser({ id: 'admin-1', role: Role.admin })),
    ).resolves.toBe(true);
  });

  it('fails an admin with only users:read against [users:read, users:create]', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
    ]);
    permissionsRepository.findByUserId.mockResolvedValue(['users:read']);

    await expect(
      guard.canActivate(contextWithUser({ id: 'admin-1', role: Role.admin })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('fails an admin with no group ([])', async () => {
    reflector.getAllAndOverride.mockReturnValue([PERMISSIONS.USERS_READ]);
    permissionsRepository.findByUserId.mockResolvedValue([]);

    await expect(
      guard.canActivate(contextWithUser({ id: 'admin-1', role: Role.admin })),
    ).rejects.toThrow(ForbiddenException);
  });
});
