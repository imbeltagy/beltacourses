import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppException, ErrorCode } from '../../errors';
import { isModerator } from '../auth.constants';
import type { RequestUser } from '../auth.types';
import { SessionService } from '../session.service';
import { TokenService } from '../token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();

    const token = this.extractToken(request);
    if (!token) throw new AppException(ErrorCode.MISSING_ACCESS_TOKEN);

    const claims = this.tokenService.verifyAccessToken(token);

    if (isModerator(claims.role)) {
      if (!claims.sid) throw new AppException(ErrorCode.INVALID_ACCESS_TOKEN);
      const alive = await this.sessionService.hasSession(
        claims.sub,
        claims.sid,
      );
      if (!alive) throw new AppException(ErrorCode.SESSION_EXPIRED);
    }

    request.user = {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role,
      ...(claims.sid ? { sid: claims.sid } : {}),
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim() || undefined;
  }
}
