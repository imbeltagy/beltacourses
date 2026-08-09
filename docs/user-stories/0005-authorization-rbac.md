# US-0005 — Authorization (RBAC)

- **Phase:** Phase 1 — MVP
- **Tasks:** T-005
- **Status:** Pending

## Story

As the platform owner, I want role- and scope-based authorization, so that each account can only do
what it is allowed to do.

## Details

- Roles guard on top of the auth guard (US-0004).
- Fine-grained **scopes** per endpoint/action.
- An `admin` (not `super admin`) belongs to a **group**, and a group is a set of scopes — the admin
  gets the scopes of their group.
- `super admin` bypasses group restrictions and manages groups.

## Acceptance criteria

- [ ] Endpoints can declare required roles and/or scopes declaratively.
- [ ] Admin groups can be created and assigned a set of scopes.
- [ ] An admin's effective permissions equal their group's scopes.
- [ ] Super admin can manage groups and their scopes.

## Notes

_None._
