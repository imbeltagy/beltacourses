import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { randomUUID } from 'node:crypto';
import type { LoginResponseDto } from '../../dto/response/login.dto';
import type { RefreshResponseDto } from '../../dto/response/refresh.dto';
import type { AuthKind, UserWithRelations } from '../../types/auth.types';
import type { RefreshClaims, TokenPair } from '../../types/token.types';
import type { Session } from '../../types/session.types';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokensUtil } from '../../utils/tokens.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokensUtil: TokensUtil,
    private readonly sessionService: SessionService,
  ) {}

  async login(
    user: UserWithRelations,
    kind: AuthKind,
    permissions: string[],
  ): Promise<LoginResponseDto> {
    if (this.tokensUtil.kindOf(user) !== kind) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const sid = randomUUID();
    const pair = this.tokensUtil.signPair(user, sid);
    // If this throws (Redis down) the login fails; no token is handed out.
    await this.sessionService.create(
      sid,
      this.snapshot(user, permissions, pair.refresh_token),
    );

    return pair;
  }

  verifyRefreshToken(refreshToken: string): RefreshClaims {
    return this.tokensUtil.verifyRefresh(refreshToken);
  }

  async refresh(
    claims: RefreshClaims,
    refreshToken: string,
    user: UserWithRelations,
    permissions: string[],
  ): Promise<RefreshResponseDto> {
    const invalid = new AppException(ErrorCode.UNAUTHORIZED);

    const session = await this.sessionService.get(claims.sid);
    if (
      !session ||
      session.userId !== claims.userId ||
      session.userId !== user.id ||
      !this.sessionService.verifyHash(refreshToken, session.hashedRefreshToken)
    ) {
      throw invalid;
    }

    // A token issued by the other login flow must not outlive a role change.
    if (
      this.tokensUtil.kindOfIssuer(claims.iss) !== this.tokensUtil.kindOf(user)
    ) {
      throw invalid;
    }

    const pair = this.tokensUtil.signPair(user, claims.sid);
    const rotated = await this.sessionService.rotate(
      claims.sid,
      session.hashedRefreshToken,
      this.snapshot(user, permissions, pair.refresh_token),
    );
    if (!rotated) throw invalid;

    return pair;
  }

  async logout(user: { id: string; sid: string }): Promise<void> {
    await this.sessionService.remove(user.sid, user.id);
  }

  async verifyPassword(password: string, hash: string): Promise<void> {
    const valid = await this.passwordService.compare(password, hash);
    if (!valid) throw new AppException(ErrorCode.INVALID_CREDENTIALS);
  }

  private snapshot(
    user: UserWithRelations,
    permissions: string[],
    refreshToken: TokenPair['refresh_token'],
  ): Session {
    return {
      userId: user.id,
      role: user.role,
      groupId: user.group_id,
      permissions,
      hashedRefreshToken: this.sessionService.hash(refreshToken),
    };
  }
}
