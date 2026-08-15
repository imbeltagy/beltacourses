/**
 * bcrypt cost factor. Optional — `PasswordService` falls back to
 * {@link DEFAULT_PASSWORD_SALT_ROUNDS} and validates the value in its constructor.
 */
export const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS;

export const DEFAULT_PASSWORD_SALT_ROUNDS = 12;

/** Below 4 bcrypt rejects the value; above 15 a single hash takes seconds. */
export const MIN_PASSWORD_SALT_ROUNDS = 4;
export const MAX_PASSWORD_SALT_ROUNDS = 15;
