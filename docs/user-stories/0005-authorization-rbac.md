# US-0005 — Authorization (RBAC)

- **Phase:** Phase 1 — MVP
- **Tasks:** T-005
- **Status:** Done

## Story

As the platform owner, I want role- and permission-based authorization, so that each account can
only do what it is allowed to do.

## Details

- `RolesGuard` and `PermissionsGuard` sit on top of the auth guard (US-0004), each reading its own
  route metadata (`@Roles()` / `@Permissions()`), composed for a controller via the `@Auth()` sugar
  decorator.
- Permissions are `resource:action` strings (e.g. `users:read`) with `*` wildcards, matched
  per-segment (Apache Shiro convention), from a hardcoded catalog covering `users` and `groups`.
- An `admin` belongs to at most one **group**, and a group is a set of permissions — the admin's
  effective permissions are exactly their group's permissions. An admin with no group, or whose
  group was soft-deleted, has none.
- `super_admin` bypasses every permission check and is the only role that can create, edit or
  delete groups, or assign one to an admin (`PUT`/`DELETE /groups/:group_id/users/:user_id`).
- A permission-gated route refuses every client role (student, teacher, academy_moderator) outright,
  regardless of the roles declared on the route — `@Permissions` needs no accompanying `@Roles` to
  be safe.

## Acceptance criteria

- [x] Endpoints can declare required roles and/or permissions declaratively.
- [x] Admin groups can be created and assigned a set of permissions.
- [x] An admin's effective permissions equal their group's permissions.
- [x] Super admin can manage groups and their permissions.
- [x] An admin with no group, or whose group was deleted, has no permissions.
- [x] A wildcard permission (`users:*`) satisfies any action on that resource.
- [x] A client role is refused on every permission-gated route regardless of the roles declared.
- [x] Only `super_admin` can add a user to a group or remove them from one, and doing so revokes
      that user's live sessions.

## Notes

- Group **writes** (`POST`/`PATCH`/`DELETE /groups`) and group **membership changes**
  (`PUT`/`DELETE /groups/:group_id/users/:user_id`) are `super_admin`-only, while group **reads**
  accept `groups:read`. An admin who could edit groups could grant themselves `users:*` —
  self-escalation — so writes stay role-gated while reads (safe, and needed by an admin UI to
  render the catalog) are permission-gated.
- A permission-gated route refuses every client role outright (`PermissionsGuard`), so `@Permissions`
  is safe to attach without an accompanying `@Roles` — a forgotten `@Roles` on a permission-gated
  route cannot expose it to a student or teacher.
