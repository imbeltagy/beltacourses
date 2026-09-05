import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { RedisService } from '@repo/service/redis';
import { REFRESH_TOKEN_HASH_SECRET } from './core.constants';
import {
  MODERATOR_REFRESH_TOKEN_TTL_SECONDS,
  sessionIndexKey,
  sessionKey,
} from './auth.constants';

/**
 * The moderator session store. Every method is a no-op-safe primitive; the
 * *policy* of when to call them lives in `apps/api`'s `AuthService`.
 *
 * Known, accepted staleness: an entry key can expire while its sid is still
 * in the index, so the index may list dead sids. Harmless: `getSession`/
 * `hasSession` go straight to the entry key, and `removeAllUserSessions`
 * deletes keys that may not exist. If a "list my active sessions" feature is
 * ever added, it must filter the index through `hasSession`.
 */
@Injectable()
export class SessionService {
  private readonly hashSecret: string;

  constructor(private readonly redis: RedisService) {
    if (!REFRESH_TOKEN_HASH_SECRET) {
      throw new Error(
        'Missing required environment variables: REFRESH_TOKEN_HASH_SECRET',
      );
    }
    this.hashSecret = REFRESH_TOKEN_HASH_SECRET;
  }

  /** Called on moderator login. Stores the hash and indexes the sid. TTL = 10 h. */
  async saveSession(
    userId: string,
    sid: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = this.hashRefreshToken(refreshToken);
    const indexKey = sessionIndexKey(userId);

    const pipeline = this.redis.client.pipeline();
    pipeline.set(
      sessionKey(userId, sid),
      hash,
      'EX',
      MODERATOR_REFRESH_TOKEN_TTL_SECONDS,
    );
    pipeline.sadd(indexKey, sid);
    // Re-EXPIRE the index on every login: the index must outlive the newest session.
    pipeline.expire(indexKey, MODERATOR_REFRESH_TOKEN_TTL_SECONDS);
    await pipeline.exec();
  }

  /** Raw read — the stored hash, or null if the session is gone. */
  getSession(userId: string, sid: string): Promise<string | null> {
    return this.redis.client.get(sessionKey(userId, sid));
  }

  /** Cheap existence check. Used by AccessTokenGuard on every moderator request. */
  async hasSession(userId: string, sid: string): Promise<boolean> {
    const result = await this.redis.client.exists(sessionKey(userId, sid));
    return result === 1;
  }

  /** getSession + timing-safe hash comparison. Used by the refresh endpoint. */
  async verifySession(
    userId: string,
    sid: string,
    refreshToken: string,
  ): Promise<boolean> {
    const stored = await this.getSession(userId, sid);
    if (!stored) return false;

    const expected = Buffer.from(this.hashRefreshToken(refreshToken));
    const actual = Buffer.from(stored);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  /** Logout. Deletes the entry and de-indexes the sid. Safe if already gone. */
  async removeSession(userId: string, sid: string): Promise<void> {
    const pipeline = this.redis.client.pipeline();
    pipeline.del(sessionKey(userId, sid));
    pipeline.srem(sessionIndexKey(userId), sid);
    await pipeline.exec();
  }

  /** Every session of one user. Returns how many were deleted. */
  async removeAllUserSessions(userId: string): Promise<number> {
    const indexKey = sessionIndexKey(userId);
    const sids = await this.redis.client.smembers(indexKey);
    if (sids.length === 0) return 0;

    const pipeline = this.redis.client.pipeline();
    for (const sid of sids) {
      pipeline.del(sessionKey(userId, sid));
    }
    pipeline.del(indexKey);
    await pipeline.exec();

    return sids.length;
  }

  /**
   * HMAC-SHA256, never bcrypt (D11): bcrypt silently truncates its input at
   * 72 bytes, and a signed JWT is longer than that, so every moderator token
   * sharing a 72-byte prefix would compare equal. Refresh tokens are already
   * high-entropy, so a slow hash buys nothing.
   */
  private hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', this.hashSecret)
      .update(refreshToken)
      .digest('base64url');
  }
}
