export const PERMISSIONS = {
  USERS_FULL_ACCESS: 'users:*',
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  GROUPS_FULL_ACCESS: 'groups:*',
  GROUPS_READ: 'groups:read',
  GROUPS_CREATE: 'groups:create',
  GROUPS_UPDATE: 'groups:update',
  GROUPS_DELETE: 'groups:delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** The shape `GET /groups/permissions` returns — a UI renders one section per resource. */
export const PERMISSION_GROUPS = {
  USERS: {
    FULL_ACCESS: PERMISSIONS.USERS_FULL_ACCESS,
    READ: PERMISSIONS.USERS_READ,
    CREATE: PERMISSIONS.USERS_CREATE,
    UPDATE: PERMISSIONS.USERS_UPDATE,
    DELETE: PERMISSIONS.USERS_DELETE,
  },
  GROUPS: {
    FULL_ACCESS: PERMISSIONS.GROUPS_FULL_ACCESS,
    READ: PERMISSIONS.GROUPS_READ,
    CREATE: PERMISSIONS.GROUPS_CREATE,
    UPDATE: PERMISSIONS.GROUPS_UPDATE,
    DELETE: PERMISSIONS.GROUPS_DELETE,
  },
} as const;

/** Flat allow-list. `POST/PATCH /groups` validates every incoming string against this. */
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(
  PERMISSIONS,
) as Permission[];

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}
