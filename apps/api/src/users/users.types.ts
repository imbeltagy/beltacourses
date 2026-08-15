import type { User } from '@repo/db';

/**
 * A user as it leaves this feature. The hash never crosses the boundary, and a
 * soft-deleted user reads as not found, so neither field is ever meaningful to
 * a caller.
 */
export type PublicUser = Omit<User, 'hashed_password' | 'deleted_at'>;

export type ListUsersResult = {
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
};
