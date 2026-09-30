import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT, PASSWORD_SALT_ROUNDS } from './core.constants';

const DEFAULT_SALT_ROUNDS = 12;
const MIN_SALT_ROUNDS = 4;
const MAX_SALT_ROUNDS = 15;

/**
 * The only class responsible for turning a plaintext password into a stored
 * hash and back. Feature services own who gets to call it and who gets to
 * read the resulting hash — this class only knows bcrypt.
 */
@Injectable()
export class PasswordService {
  private readonly saltRounds: number;
  private readonly salt: string;

  constructor() {
    this.saltRounds = this.parseSaltRounds(PASSWORD_SALT_ROUNDS);

    if (!PASSWORD_SALT) {
      throw new Error('PASSWORD_SALT environment variable is required');
    }
    this.salt = PASSWORD_SALT;
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain + this.salt, this.saltRounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain + this.salt, hashed);
  }

  private parseSaltRounds(raw: string | undefined): number {
    if (raw === undefined) return DEFAULT_SALT_ROUNDS;

    const rounds = Number(raw);
    if (
      !Number.isInteger(rounds) ||
      rounds < MIN_SALT_ROUNDS ||
      rounds > MAX_SALT_ROUNDS
    ) {
      throw new Error(
        `PASSWORD_SALT_ROUNDS must be an integer between ${MIN_SALT_ROUNDS} and ${MAX_SALT_ROUNDS}, got "${raw}"`,
      );
    }
    return rounds;
  }
}
