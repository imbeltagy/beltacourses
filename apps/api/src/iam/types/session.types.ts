import type { Role } from '@repo/db';

/** Snapshot stored in Redis under `session:{sid}`. */
export type Session = {
  userId: string;
  role: Role;
  groupId: string | null;
  permissions: string[];
  hashedRefreshToken: string;
};
