import { Injectable } from '@nestjs/common';
import { RedisService } from '@repo/backend/redis';
import {
  SESSION_KEY_PREFIX,
  USER_SESSIONS_KEY_PREFIX,
} from '../constants/iam.constants';
import type { Session } from '../types/iam.types';

/**
 * Compare-and-swap: overwrite the session only while its stored refresh hash is
 * still the one the caller presented. Returns 1 on swap, 0 otherwise.
 * KEYS[1] session key, KEYS[2] user's sid set; ARGV[1] expected hash,
 * ARGV[2] new session JSON, ARGV[3] TTL seconds, ARGV[4] sid.
 */
const ROTATE_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current then return 0 end
local ok, session = pcall(cjson.decode, current)
if not ok or session.hashedRefreshToken ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
redis.call('SADD', KEYS[2], ARGV[4])
redis.call('EXPIRE', KEYS[2], ARGV[3])
return 1
`;

/** Talks to Redis and nothing else. Policy (TTLs, hashing) lives in `SessionService`. */
@Injectable()
export class SessionRepository {
  constructor(private readonly redis: RedisService) {}

  static sessionKey(sid: string): string {
    return `${SESSION_KEY_PREFIX}${sid}`;
  }

  static userSessionsKey(userId: string): string {
    return `${USER_SESSIONS_KEY_PREFIX}${userId}`;
  }

  /** SET the session and index its sid, atomically. */
  async create(
    sid: string,
    session: Session,
    ttlSeconds: number,
  ): Promise<void> {
    const indexKey = SessionRepository.userSessionsKey(session.userId);
    const results = await this.redis.client
      .multi()
      .set(
        SessionRepository.sessionKey(sid),
        JSON.stringify(session),
        'EX',
        ttlSeconds,
      )
      .sadd(indexKey, sid)
      .expire(indexKey, ttlSeconds)
      .exec();

    const failed = results?.find(([error]) => error);
    if (!results || failed) {
      throw failed?.[0] ?? new Error('Redis MULTI aborted');
    }
  }

  async get(sid: string): Promise<Session | null> {
    const raw = await this.redis.client.get(SessionRepository.sessionKey(sid));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }

  /** Safe if already gone. */
  async remove(sid: string, userId: string): Promise<void> {
    await this.redis.client
      .multi()
      .del(SessionRepository.sessionKey(sid))
      .srem(SessionRepository.userSessionsKey(userId), sid)
      .exec();
  }

  /** Every session of one user. Returns how many sids were indexed. */
  async removeAllForUser(userId: string): Promise<number> {
    const indexKey = SessionRepository.userSessionsKey(userId);
    const sids = await this.redis.client.smembers(indexKey);
    if (sids.length === 0) return 0;

    const multi = this.redis.client.multi();
    for (const sid of sids) multi.del(SessionRepository.sessionKey(sid));
    multi.del(indexKey);
    await multi.exec();

    return sids.length;
  }

  /** Atomic CAS. False when the session is gone or `expectedHash` is stale. */
  async rotate(
    sid: string,
    expectedHash: string,
    session: Session,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.redis.client.eval(
      ROTATE_SCRIPT,
      2,
      SessionRepository.sessionKey(sid),
      SessionRepository.userSessionsKey(session.userId),
      expectedHash,
      JSON.stringify(session),
      ttlSeconds,
      sid,
    );
    return result === 1;
  }
}
