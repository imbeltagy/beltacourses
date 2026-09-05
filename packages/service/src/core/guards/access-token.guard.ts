import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { isModerator } from '../auth.constants';
import type { RequestUser } from '../auth.types';
import { SessionService } from '../session.service';
import { TokenService } from '../token.service';

/**
 * Verifies the bearer access token and, for moderators only, confirms the
 * Redis session it names is still alive. Trades a DB hit (the old
 * behaviour) for a 30 min / 5 min TTL (D8) — the worst case is a deleted
 * client keeping access for up to 30 min, and a moderator's session is
 * killed instantly by logout regardless of TTL.
 */
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
    if (!token) throw new UnauthorizedException('Missing access token');

    const claims = this.tokenService.verifyAccessToken(token);

    if (isModerator(claims.role)) {
      if (!claims.sid) throw new UnauthorizedException('Invalid access token');
      const alive = await this.sessionService.hasSession(
        claims.sub,
        claims.sid,
      );
      if (!alive) throw new UnauthorizedException('Session expired');
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
