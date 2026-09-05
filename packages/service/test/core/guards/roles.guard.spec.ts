import {
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@repo/db';
import { RolesGuard } from '../../../src/core/guards/roles.guard';

function contextWithUser(user?: unknown): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('throws InternalServerErrorException when no metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(() => guard.canActivate(contextWithUser({ role: Role.admin }))).toThrow(
      InternalServerErrorException,
    );
  });

  it('throws InternalServerErrorException for an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(() => guard.canActivate(contextWithUser({ role: Role.admin }))).toThrow(
      InternalServerErrorException,
    );
  });

  it('throws UnauthorizedException when request.user is absent', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.admin]);

    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('returns true for a matching role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.admin, Role.super_admin]);

    expect(guard.canActivate(contextWithUser({ role: Role.admin }))).toBe(true);
  });

  it('throws ForbiddenException for a non-matching role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.super_admin]);

    expect(() => guard.canActivate(contextWithUser({ role: Role.admin }))).toThrow(
      ForbiddenException,
    );
  });
});
