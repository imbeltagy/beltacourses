import { Role } from '@repo/db';
import type { GroupWithRelations } from '../../src/groups/groups.types';
import type { UserWithRelations } from '../../src/users/users.types';

const DATE = new Date('2026-08-01T00:00:00.000Z');

/** A user row as the repository returns it — hash and all. */
export const userRow = (
  overrides: Partial<UserWithRelations> = {},
): UserWithRelations => ({
  id: 'user-1',
  email: 'student@beltacourses.com',
  hashed_password: 'hashed',
  name: 'Jane Doe',
  role: Role.student,
  confirmed: false,
  bio: null,
  gender: null,
  date_of_birth: null,
  avatar_id: null,
  avatar: null,
  group_id: null,
  group: null,
  created_at: DATE,
  updated_at: DATE,
  deleted_at: null,
  ...overrides,
});

/** A group row as the repository returns it. */
export const groupRow = (
  overrides: Partial<GroupWithRelations> = {},
): GroupWithRelations => ({
  id: 'group-1',
  name: 'Support',
  description: null,
  permissions: [
    {
      id: 'perm-1',
      group_id: 'group-1',
      permission: 'users:read',
      created_at: DATE,
    },
  ],
  _count: { users: 2 },
  created_at: DATE,
  updated_at: DATE,
  deleted_at: null,
  ...overrides,
});
