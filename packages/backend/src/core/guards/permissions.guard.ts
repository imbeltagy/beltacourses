import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException, ErrorCode } from '../../errors';
import { Role } from '@repo/db';
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

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user) throw new AppException(ErrorCode.UNAUTHORIZED);

    if (user.role === Role.super_admin) return true;

    // A permission-gated route is staff-only by definition, so a student or
    // teacher is refused here even if @Roles was forgotten.
    if (user.role !== Role.admin) throw new AppException(ErrorCode.FORBIDDEN);

    // Nothing declared, so there is nothing to enforce . Any authenticated admin can access.
    if (!permissions || permissions.length === 0) return true;

    const granted = await this.permissionsRepository.findByUserId(user.id);
    if (!hasAllPermissions(granted, permissions)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    return true;
  }
}
