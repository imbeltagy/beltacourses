import type { Paginated, PaginationQuery } from "./common";

/**
 * Mirrors `GroupResponse` in `apps/api/src/groups/dto/response/group.dto.ts`.
 *
 * The API's own model is `Group` + `GroupPermission`; an older admin project
 * called these "roles" and modelled them differently. This is the current
 * shape — do not port the old one.
 */
export type Group = {
  id: string;
  name: string;
  description: string | null;
  /** Values from the hardcoded permission catalog, e.g. `users:read`. */
  permissions: string[];
  users_count: number;
  created_at: string;
  updated_at: string;
};

export type ListGroupsQuery = PaginationQuery & {
  /** Matches the group name, case-insensitive. */
  search?: string;
};

export type ListGroupsResponse = Paginated<Group>;

/**
 * `GET /groups/permissions` — resource -> action -> permission string, e.g.
 * `{ USERS: { READ: "users:read", ... }, GROUPS: { ... } }`. A UI renders one
 * section per resource.
 */
export type PermissionCatalog = Record<string, Record<string, string>>;
