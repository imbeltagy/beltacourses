import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  REFRESH_TOKEN_HASH_SECRET,
  refreshTokenTtl,
} from '../../constants/iam.constants';
import type { Session } from '../../types/iam.types';
import { SessionRepository } from './session.repository';

/**
 * Session policy: TTL per role (the refresh lifetime) and the refresh-token
 * hash. Storage is `SessionRepository`'s job.
 */
@Injectable()
export class SessionService {
  private readonly hashSecret: string;

  constructor(private readonly sessionRepository: SessionRepository) {
    if (!REFRESH_TOKEN_HASH_SECRET) {
      throw new Error(
        'Missing required environment variables: REFRESH_TOKEN_HASH_SECRET',
      );
    }
    this.hashSecret = REFRESH_TOKEN_HASH_SECRET;
  }

  create(sid: string, session: Session): Promise<void> {
    return this.sessionRepository.create(
      sid,
      session,
      refreshTokenTtl(session.role),
    );
  }

  get(sid: string): Promise<Session | null> {
    return this.sessionRepository.get(sid);
  }

  /** Single-use refresh: false when the stored hash is not `expectedHash` any more. */
  rotate(
    sid: string,
    expectedHash: string,
    session: Session,
  ): Promise<boolean> {
    return this.sessionRepository.rotate(
      sid,
      expectedHash,
      session,
      refreshTokenTtl(session.role),
    );
  }

  remove(sid: string, userId: string): Promise<void> {
    return this.sessionRepository.remove(sid, userId);
  }

  removeAllForUser(userId: string): Promise<number> {
    return this.sessionRepository.removeAllForUser(userId);
  }

  async removeAllForUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map((id) => this.removeAllForUser(id)));
  }

  /**
   * HMAC-SHA256, never bcrypt: bcrypt truncates its input at 72 bytes and a
   * signed JWT is longer, so tokens sharing a prefix would compare equal.
   */
  hash(token: string): string {
    return createHmac('sha256', this.hashSecret)
      .update(token)
      .digest('base64url');
  }

  /** Timing-safe: does `token` hash to `hash`? */
  verifyHash(token: string, hash: string): boolean {
    const expected = Buffer.from(this.hash(token));
    const actual = Buffer.from(hash);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }
}
