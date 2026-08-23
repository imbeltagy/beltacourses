import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ACCESS_TOKEN_SECRET } from './core.constants';

/**
 * Stateless access tokens: `base64url(payload).base64url(hmac)`, never persisted
 * anywhere. Anyone holding the secret can verify a token without a database
 * round trip, and there is no expiration — a token is valid for as long as the
 * user it names still exists (checked by the caller, not here).
 */
@Injectable()
export class TokenService {
  private readonly secret: string;

  constructor() {
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET environment variable is required');
    }
    this.secret = ACCESS_TOKEN_SECRET;
  }

  sign(userId: string): string {
    const payload = Buffer.from(JSON.stringify({ sub: userId })).toString(
      'base64url',
    );
    return `${payload}.${this.hmac(payload)}`;
  }

  /** Returns the user id encoded in the token. Throws 401 on any tampering. */
  verify(token: string): string {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) {
      throw new UnauthorizedException('Invalid access token');
    }

    const expected = Buffer.from(this.hmac(payload));
    const actual = Buffer.from(signature);
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    try {
      const { sub } = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { sub: string };
      if (!sub) throw new Error('missing sub');
      return sub;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private hmac(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }
}
