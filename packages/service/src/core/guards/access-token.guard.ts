import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from '../token.service';
import { UsersRepository } from '../users.repository';

export type RequestUser = { id: string };

/**
 * Verifies the bearer access token and confirms the user it names still
 * exists (tokens never expire, so this is the only thing that revokes one).
 * Attaches only `{ id }` to the request — the controller fetches whatever
 * detail it needs through its own users service.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: RequestUser }>();

    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing access token');

    const userId = this.tokenService.verify(token);

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid access token');

    request.user = { id: userId };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim() || undefined;
  }
}
