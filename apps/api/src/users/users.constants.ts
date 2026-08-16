import { Role } from '@repo/db';

/**
 * The roles `POST /users` may assign. `super_admin` is deliberately absent: the
 * account that can do everything is not something an HTTP caller creates, so it
 * is seeded or promoted deliberately, never through the API. The service itself
 * still accepts any `Role` — the restriction belongs at the transport boundary.
 */
export const ASSIGNABLE_ROLES = [
  Role.student,
  Role.teacher,
  Role.academy_moderator,
  Role.admin,
] as const;

/**
 * bcrypt cost factor. Optional — `PasswordService` falls back to
 * {@link DEFAULT_PASSWORD_SALT_ROUNDS} and validates the value in its constructor.
 */
export const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS;

export const DEFAULT_PASSWORD_SALT_ROUNDS = 12;

/** Below 4 bcrypt rejects the value; above 15 a single hash takes seconds. */
export const MIN_PASSWORD_SALT_ROUNDS = 4;
export const MAX_PASSWORD_SALT_ROUNDS = 15;
