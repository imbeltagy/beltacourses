import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import {
  DEFAULT_PASSWORD_SALT_ROUNDS,
  MAX_PASSWORD_SALT_ROUNDS,
  MIN_PASSWORD_SALT_ROUNDS,
  PASSWORD_SALT_ROUNDS,
} from './users.constants';

/**
 * Hashing lives behind its own provider so `UsersService` is the only class that
 * ever holds a hash. It is provided by `UsersModule` but deliberately not
 * exported — see the module for why.
 */
@Injectable()
export class PasswordService {
  private readonly rounds: number;

  constructor() {
    this.rounds = PasswordService.resolveRounds(PASSWORD_SALT_ROUNDS);
  }

  /**
   * Fails app boot rather than the first registration: an unusable cost factor
   * is a configuration bug, and a silent fallback would hide it.
   */
  private static resolveRounds(raw: string | undefined): number {
    if (raw === undefined || raw === '') return DEFAULT_PASSWORD_SALT_ROUNDS;

    const rounds = Number(raw);
    const valid =
      Number.isInteger(rounds) &&
      rounds >= MIN_PASSWORD_SALT_ROUNDS &&
      rounds <= MAX_PASSWORD_SALT_ROUNDS;

    if (!valid) {
      throw new Error(
        `PasswordService: PASSWORD_SALT_ROUNDS must be an integer between ` +
          `${MIN_PASSWORD_SALT_ROUNDS} and ${MAX_PASSWORD_SALT_ROUNDS}, got "${raw}"`,
      );
    }

    return rounds;
  }

  hash(plain: string): Promise<string> {
    return hash(plain, this.rounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
