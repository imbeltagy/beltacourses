import type { Paginated, PaginationQuery } from "./common";

/**
 * Mirrors `UserResponse` in `apps/api/src/users/dto/response/user.dto.ts`.
 * Dates are ISO strings here — they are `Date` on the API side but arrive
 * serialized.
 */

export const ROLES = [
  "student",
  "teacher",
  "academy_moderator",
  "admin",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

/** `super_admin` is never assignable over HTTP. */
export const ASSIGNABLE_ROLES = ROLES.filter(
  (role) => role !== "super_admin",
) as Exclude<Role, "super_admin">[];

/** Roles that may sign in to the admin panel at all. */
export const MODERATOR_ROLES: Role[] = ["admin", "super_admin"];

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export type UserAvatar = {
  id: string;
  url: string;
};

/** Only an admin ever has one. */
export type UserGroupRef = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  confirmed: boolean;
  bio: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  avatar: UserAvatar | null;
  group: UserGroupRef | null;
  created_at: string;
  updated_at: string;
};

export type ListUsersQuery = PaginationQuery & {
  role?: Role;
  /** Matches name or email, case-insensitive. */
  search?: string;
};

export type ListUsersResponse = Paginated<User>;

/**
 * Fields of `POST /users`. `avatar` makes the request multipart, so the action
 * turns this into `FormData`; a blank optional field is simply omitted.
 */
export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role?: Exclude<Role, "super_admin">;
  confirmed?: boolean;
  bio?: string;
  gender?: Gender;
  date_of_birth?: string;
  avatar?: File;
};

/**
 * Fields of `PATCH /users/:id`. A nullable field is cleared by sending `null`,
 * which the action sends as a blank form field — multipart has no `null`.
 */
export type UpdateUserInput = {
  name?: string;
  confirmed?: boolean;
  bio?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  avatar?: File;
};
