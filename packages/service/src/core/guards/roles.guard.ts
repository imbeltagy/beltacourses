import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '@repo/db';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles || roles.length === 0) {
      // A wiring bug, not a client error — @Roles() itself also throws at
      // import time, so this branch should be unreachable. Keep it anyway.
      throw new InternalServerErrorException(
        'RolesGuard used without @Roles()',
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const user = request.user;
    if (!user) throw new UnauthorizedException();

    if (!roles.includes(user.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
