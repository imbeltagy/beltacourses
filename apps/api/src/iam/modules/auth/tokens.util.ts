import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AppException, ErrorCode } from '@repo/backend/errors';
import {
  ACCESS_TOKEN_SECRET,
  accessTokenTtl,
  API_DOMAIN,
  CLIENT_LOGIN_PATH,
  isModerator,
  MODERATOR_LOGIN_PATH,
  REFRESH_TOKEN_SECRET,
  refreshTokenTtl,
} from '../../constants/iam.constants';
import type {
  AccessClaims,
  AuthKind,
  RefreshClaims,
  TokenPair,
  TokenSubject,
} from '../../types/iam.types';

const ALGORITHM = 'HS256';
const ACCESS_TYP = 'at+jwt';
const REFRESH_TYP = 'rt+jwt';

/**
 * Signs and verifies both token kinds with separate secrets. `alg` is pinned to
 * HS256 on sign and verify, `typ` tells the two kinds apart, there is no `kid`.
 * Two private `JwtService`s are built directly: `JwtModule` is a `@Module`.
 */
@Injectable()
export class TokensUtil {
  private readonly accessJwt: JwtService;
  private readonly refreshJwt: JwtService;
  private readonly audience: string;
  private readonly issuers: Record<AuthKind, string>;

  constructor() {
    const missing: string[] = [];
    if (!ACCESS_TOKEN_SECRET) missing.push('ACCESS_TOKEN_SECRET');
    if (!REFRESH_TOKEN_SECRET) missing.push('REFRESH_TOKEN_SECRET');
    if (!API_DOMAIN) missing.push('API_DOMAIN');
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    this.accessJwt = new JwtService({ secret: ACCESS_TOKEN_SECRET });
    this.refreshJwt = new JwtService({ secret: REFRESH_TOKEN_SECRET });
    this.audience = API_DOMAIN as string;
    this.issuers = {
      client: `${API_DOMAIN}${CLIENT_LOGIN_PATH}`,
      moderator: `${API_DOMAIN}${MODERATOR_LOGIN_PATH}`,
    };
  }

  /** The login flow a role belongs to. */
  kindOf(user: { role: TokenSubject['role'] }): AuthKind {
    return isModerator(user.role) ? 'moderator' : 'client';
  }

  signPair(user: TokenSubject, sid: string): TokenPair {
    const kind = this.kindOf(user);
    const accessTtl = accessTokenTtl(user.role);
    const refreshTtl = refreshTokenTtl(user.role);

    const access_token = this.accessJwt.sign(
      {
        sub: user.id,
        sid,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      {
        algorithm: ALGORITHM,
        header: { alg: ALGORITHM, typ: ACCESS_TYP },
        issuer: this.issuers[kind],
        audience: this.audience,
        expiresIn: accessTtl,
      },
    );
    const refresh_token = this.refreshJwt.sign(
      // jti: without it two refreshes in one second sign identical tokens,
      // which defeats single-use rotation.
      { sid, userId: user.id, jti: randomUUID() },
      {
        algorithm: ALGORITHM,
        header: { alg: ALGORITHM, typ: REFRESH_TYP },
        issuer: this.issuers[kind],
        audience: this.audience,
        expiresIn: refreshTtl,
      },
    );

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: accessTtl,
      refresh_expires_in: refreshTtl,
    };
  }

  /**
   * Checks signature, alg, typ, aud and iss, and that the role belongs to the
   * flow named by the issuer (a moderator role only under the moderators issuer).
   */
  verifyAccess(token: string): AccessClaims {
    const error = ErrorCode.INVALID_ACCESS_TOKEN;
    const claims = this.verify<AccessClaims>(
      this.accessJwt,
      token,
      ACCESS_TYP,
      error,
    );
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.sid !== 'string' ||
      this.issuers[this.kindOf(claims)] !== claims.iss
    ) {
      throw new AppException(error);
    }
    return claims;
  }

  /** Same checks as `verifyAccess`, minus the role (refresh claims carry none). */
  verifyRefresh(token: string): RefreshClaims {
    const error = ErrorCode.INVALID_REFRESH_TOKEN;
    const claims = this.verify<RefreshClaims>(
      this.refreshJwt,
      token,
      REFRESH_TYP,
      error,
    );
    if (
      typeof claims.sid !== 'string' ||
      typeof claims.userId !== 'string' ||
      typeof claims.jti !== 'string'
    ) {
      throw new AppException(error);
    }
    return claims;
  }

  /** The login flow a refresh token was issued by, read from its (verified) `iss`. */
  kindOfIssuer(iss: string): AuthKind | undefined {
    if (iss === this.issuers.client) return 'client';
    if (iss === this.issuers.moderator) return 'moderator';
    return undefined;
  }

  /**
   * Every failure — forged, expired, wrong alg/typ/aud/iss — collapses to the
   * same 401 so a caller cannot tell which check a token failed.
   */
  private verify<T extends object>(
    jwt: JwtService,
    token: string,
    expectedTyp: string,
    error: ErrorCode,
  ): T {
    try {
      const decoded = jwt.decode<{ header?: { typ?: string } } | null>(token, {
        complete: true,
      });
      if (decoded?.header?.typ !== expectedTyp) {
        throw new AppException(error);
      }
      return jwt.verify<T>(token, {
        algorithms: [ALGORITHM],
        audience: this.audience,
        issuer: [this.issuers.client, this.issuers.moderator],
      });
    } catch {
      throw new AppException(error);
    }
  }
}
