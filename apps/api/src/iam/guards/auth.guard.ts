import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import type { Request } from 'express';
import { AUTH_OPTIONS_KEY, isModerator } from '../constants/iam.constants';
import { TokensUtil } from '../modules/auth/tokens.util';
import { SessionService } from '../modules/auth/session.service';
import type { AuthOptions, RequestUser } from '../types/iam.types';
import { hasAllPermissions } from '../utils/permissions.util';

function toArray<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

/**
 * The one guard, registered globally. Reads `@Auth()` metadata, verifies the
 * access token and fills `request.user`.
 *
 * Clients: token only, no Redis. Moderators: the Redis session must be alive,
 * and an admin's permissions come from the session snapshot (no DB hit).
 */
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

    if (options.public === true) {
      request.user = null;
      return true;
    }

    const token = this.extractToken(request);
    if (!token) throw new AppException(ErrorCode.MISSING_ACCESS_TOKEN);

    const claims = this.tokensUtil.verifyAccess(token);

    const roles = toArray(options.roles);
    if (roles.length > 0 && !roles.includes(claims.role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    const required = toArray(options.permissions);

    let groupId: string | null = null;
    let permissions: string[] = [];

    if (isModerator(claims.role)) {
      const session = await this.sessionService.get(claims.sid);
      if (!session || session.userId !== claims.sub) {
        throw new AppException(ErrorCode.SESSION_EXPIRED);
      }
      groupId = session.groupId;
      permissions = session.permissions;

      if (
        claims.role === Role.admin &&
        !hasAllPermissions(permissions, required)
      ) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
    } else if (required.length > 0) {
      // Permissions belong to staff; a client never satisfies them.
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
