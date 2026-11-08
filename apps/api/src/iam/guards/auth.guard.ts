import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import type { Request } from 'express';
import { AUTH_OPTIONS_KEY, isModerator } from '../constants/auth.constants';
import { TokensUtil } from '../utils/tokens.util';
import { SessionService } from '../modules/auth/session.service';
import type { AuthOptions, RequestUser } from '../types/auth.types';
import type { AccessClaims } from '../types/token.types';
import { hasAllPermissions } from '../utils/permissions.util';

function toArray<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokensUtil: TokensUtil,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<AuthOptions | undefined>(
      AUTH_OPTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      // A wiring bug, not a client error: the AppExceptionFilter maps this to a generic 500.
      throw new Error(
        `Missing @Auth() on ${context.getClass().name}.${context.getHandler().name}`,
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser | null }>();

    const token = this.extractToken(request);
    if (!token) {
      if (!options.public) throw new AppException(ErrorCode.UNAUTHORIZED);

      request.user = null;
      return true;
    }

    let claims: AccessClaims;
    try {
      claims = this.tokensUtil.verifyAccess(token);
    } catch (err) {
      if (!options.public) throw err;

      request.user = null;
      return true;
    }

    // If roles are specified. Then it's not public and token is required.
    const roles = toArray(options.roles);
    if (roles.length > 0 && !roles.includes(claims.role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    const required = toArray(options.permissions);

    // Refuse Clients if routes requires permissions
    if (required.length > 0 && !isModerator(claims.role))
      throw new AppException(ErrorCode.FORBIDDEN);

    // Only valid session pass
    const session = await this.sessionService.get(claims.sid);
    if (!session || session.userId !== claims.sub) {
      throw new AppException(ErrorCode.SESSION_EXPIRED);
    }

    const groupId = session.groupId;
    const permissions = session.permissions;

    // Super admin pass anyway.
    // Clients don't reach her if permissions are required.
    if (
      claims.role === Role.admin &&
      !hasAllPermissions(permissions, required)
    ) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }

    request.user = {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role,
      sid: claims.sid,
      groupId,
      permissions,
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim() || undefined;
  }
}
