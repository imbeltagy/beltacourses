import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { randomUUID } from 'node:crypto';
import {
  isModerator,
  PasswordService,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import type { TokenClaims, RequestUser, TokenUser } from '@repo/backend/core';
import type { UserWithRelations } from '../types/iam.types';
import type { LoginResponseDto } from '../dto/response/login.dto';
import type { RefreshResponseDto } from '../dto/response/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Shared by both login endpoints. Same generic 401 as a wrong password on
   * a role mismatch, so neither endpoint reveals whether an address is staff.
   */
  async issueTokens(
    user: UserWithRelations,
    expectModerator: boolean,
  ): Promise<LoginResponseDto> {
    if (isModerator(user.role) !== expectModerator) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    if (!expectModerator) {
      return this.tokenService.signPair(tokenUser);
    }

    // The sid must exist before the refresh token is signed — it is a claim inside it.
    const sid = randomUUID();
    const refresh_token = this.tokenService.signRefreshToken(tokenUser, sid);
    // If this throws (Redis down), the login fails with a 503; no token is
    // handed out. Never fall back to a session-less moderator token.
    await this.sessionService.saveSession(user.id, sid, refresh_token);
    const access_token = this.tokenService.signAccessToken(tokenUser, sid);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: this.tokenService.accessTokenTtl(user.role),
    };
  }

  /** Verifies the refresh token's signature and expiry. */
  verifyRefreshToken(refreshToken: string): TokenClaims {
    return this.tokenService.verifyRefreshToken(refreshToken);
  }

  /** POST /auth/refresh — both role groups. `user` is the current DB row for `claims.sub`. */
  async refresh(
    claims: TokenClaims,
    refreshToken: string,
    user: UserWithRelations,
  ): Promise<RefreshResponseDto> {
    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Branch on the current DB role, not the role inside the token.
    if (isModerator(user.role)) {
      if (!claims.sid) throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);

      const ok = await this.sessionService.verifySession(
        user.id,
        claims.sid,
        refreshToken,
      );
      if (!ok) throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);

      return {
        access_token: this.tokenService.signAccessToken(tokenUser, claims.sid),
        token_type: 'Bearer',
        expires_in: this.tokenService.accessTokenTtl(user.role),
      };
    }

    return {
      access_token: this.tokenService.signAccessToken(tokenUser),
      token_type: 'Bearer',
      expires_in: this.tokenService.accessTokenTtl(user.role),
    };
  }

  /** POST /auth/logout — kills the Redis session for a moderator; no-op for a client. */
  async logout(user: RequestUser): Promise<void> {
    if (!user.sid) return;
    await this.sessionService.removeSession(user.id, user.sid);
  }

  /** Called by UsersService when an admin's group changes. */
  revokeAllSessions(userId: string): Promise<number> {
    return this.sessionService.removeAllUserSessions(userId);
  }

  /** Throws the generic INVALID_CREDENTIALS unless `password` matches `hash`. */
  async verifyPassword(password: string, hash: string): Promise<void> {
    const valid = await this.passwordService.compare(password, hash);
    if (!valid) throw new AppException(ErrorCode.INVALID_CREDENTIALS);
  }
}
