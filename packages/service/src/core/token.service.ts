import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@repo/db';
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
} from './core.constants';
import {
  CLIENT_ACCESS_TOKEN_TTL_SECONDS,
  CLIENT_REFRESH_TOKEN_TTL_SECONDS,
  MODERATOR_ACCESS_TOKEN_TTL_SECONDS,
  MODERATOR_REFRESH_TOKEN_TTL_SECONDS,
  isModerator,
} from './auth.constants';
import type { TokenClaims, TokenPair, TokenUser } from './auth.types';

/**
 * Signs and verifies both token kinds with **separate** secrets (D13) — a
 * leaked access secret must not be able to mint refresh tokens. Two private
 * `JwtService` instances are constructed directly (D17): `JwtModule` is a
 * `@Module`, and `packages/service` ships providers only.
 */
@Injectable()
export class TokenService {
  private readonly accessJwt: JwtService;
  private readonly refreshJwt: JwtService;

  constructor() {
    const missing: string[] = [];
    if (!ACCESS_TOKEN_SECRET) missing.push('ACCESS_TOKEN_SECRET');
    if (!REFRESH_TOKEN_SECRET) missing.push('REFRESH_TOKEN_SECRET');
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      );
    }

    this.accessJwt = new JwtService({ secret: ACCESS_TOKEN_SECRET });
    this.refreshJwt = new JwtService({ secret: REFRESH_TOKEN_SECRET });
  }

  signAccessToken(user: TokenUser, sid?: string): string {
    return this.accessJwt.sign(this.payload(user, 'access', sid), {
      expiresIn: this.accessTokenTtl(user.role),
    });
  }

  signRefreshToken(user: TokenUser, sid?: string): string {
    return this.refreshJwt.sign(this.payload(user, 'refresh', sid), {
      expiresIn: this.refreshTokenTtl(user.role),
    });
  }

  signPair(user: TokenUser, sid?: string): TokenPair {
    return {
      access_token: this.signAccessToken(user, sid),
      refresh_token: this.signRefreshToken(user, sid),
      token_type: 'Bearer',
      expires_in: this.accessTokenTtl(user.role),
    };
  }

  verifyAccessToken(token: string): TokenClaims {
    return this.verify(this.accessJwt, token, 'access', 'Invalid access token');
  }

  verifyRefreshToken(token: string): TokenClaims {
    return this.verify(
      this.refreshJwt,
      token,
      'refresh',
      'Invalid refresh token',
    );
  }

  accessTokenTtl(role: Role): number {
    return isModerator(role)
      ? MODERATOR_ACCESS_TOKEN_TTL_SECONDS
      : CLIENT_ACCESS_TOKEN_TTL_SECONDS;
  }

  private refreshTokenTtl(role: Role): number {
    return isModerator(role)
      ? MODERATOR_REFRESH_TOKEN_TTL_SECONDS
      : CLIENT_REFRESH_TOKEN_TTL_SECONDS;
  }

  private payload(
    user: TokenUser,
    typ: TokenClaims['typ'],
    sid?: string,
  ): Omit<TokenClaims, 'iat' | 'exp'> {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      typ,
      ...(sid !== undefined ? { sid } : {}),
    };
  }

  /**
   * Catches every verification error — a wrong secret (`JsonWebTokenError`)
   * and an elapsed TTL (`TokenExpiredError`) both collapse to the same 401,
   * so a caller can never learn whether a token was forged or merely expired.
   */
  private verify(
    jwt: JwtService,
    token: string,
    expectedTyp: TokenClaims['typ'],
    message: string,
  ): TokenClaims {
    try {
      const claims = jwt.verify<TokenClaims>(token);
      if (claims.typ !== expectedTyp) {
        throw new UnauthorizedException(message);
      }
      return claims;
    } catch {
      throw new UnauthorizedException(message);
    }
  }
}
