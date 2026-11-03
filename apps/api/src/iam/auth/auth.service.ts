import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { randomUUID } from 'node:crypto';
import type { LoginResponseDto } from '../dto/response/login.dto';
import type { RefreshResponseDto } from '../dto/response/refresh.dto';
import type {
  AuthKind,
  RefreshClaims,
  Session,
  TokenPair,
  UserWithRelations,
} from '../types/iam.types';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokensUtil } from './tokens.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokensUtil: TokensUtil,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Shared by both login endpoints. A role/flow mismatch is the same generic
   * 401 as a wrong password, so neither endpoint reveals whether an address is
   * staff. `permissions` is the snapshot the facade loaded for the session.
   */
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

  /** Verifies the refresh token's signature, alg, typ, aud, iss and expiry. */
  verifyRefreshToken(refreshToken: string): RefreshClaims {
    return this.tokensUtil.verifyRefresh(refreshToken);
  }

  /**
   * POST /auth/refresh. `user` and `permissions` are freshly loaded by the
   * facade. Single use: the session is swapped by compare-and-swap on the
   * stored hash, so of two concurrent refreshes with one token the loser 401s.
   */
  async refresh(
    claims: RefreshClaims,
    refreshToken: string,
    user: UserWithRelations,
    permissions: string[],
  ): Promise<RefreshResponseDto> {
    const invalid = new AppException(ErrorCode.INVALID_REFRESH_TOKEN);

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

  /** POST /auth/logout — ends only the caller's session. */
  async logout(user: { id: string; sid: string }): Promise<void> {
    await this.sessionService.remove(user.sid, user.id);
  }

  /** Throws the generic INVALID_CREDENTIALS unless `password` matches `hash`. */
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
