import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Role } from '@repo/db';
import { isModerator } from '../auth.constants';
import type { RequestUser } from '../auth.types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { hasAllPermissions } from '../permissions';
import type { Permission } from '../permissions.constants';
import { PermissionsRepository } from '../permissions.repository';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<
      Permission[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Nothing declared, so there is nothing to enforce — the guard is a
    // no-op and safe to attach unconditionally. Deliberately asymmetric
    // with RolesGuard (D9): a permissions guard with nothing to check is a
    // legitimate "any authenticated moderator" route.
    if (!permissions || permissions.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user) throw new UnauthorizedException();

    // A permission-gated route is staff-only by definition, so a student or
    // teacher is refused here even if @Roles was forgotten.
    if (!isModerator(user.role)) throw new ForbiddenException();

    if (user.role === Role.super_admin) return true;

    const granted = await this.permissionsRepository.findByUserId(user.id);
    if (!hasAllPermissions(granted, permissions)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
