# Authentication and authorization

- **Implements:** `003-authN`, `004-authZ`
- **Status:** Implemented

The first half says what the system does and why. The second half is the mechanics behind it.

## Two account tiers

|                 | Clients                             | Moderators               |
| --------------- | ----------------------------------- | ------------------------ |
| Roles           | student, teacher, academy moderator | admin, super admin       |
| Who             | the public                          | staff                    |
| Sign in at      | the public app                      | a separate staff sign-in |
| Remote sign-out | no                                  | yes                      |

Different risk profiles: a compromised student account is a nuisance, a compromised admin account
can touch everyone's data. Staff get a shorter leash and a kill switch. Both sign-in flows return
the identical "invalid email or password" for a wrong password _and_ for using the wrong flow — the
public app never reveals that an address belongs to staff.

## Staying signed in

A short-lived credential proves identity on every request; a longer-lived one silently gets a new
short-lived one without a password. Invisible in normal use — refreshed automatically.

|                                                  | Clients      | Moderators          |
| ------------------------------------------------ | ------------ | ------------------- |
| Short-lived, refreshed automatically             | 30 min       | 5 min               |
| Total lifetime before a real sign-in is required | 7 days       | 10 hours            |
| Remote "sign out everywhere"                     | not possible | instant, everywhere |

## Authorization: roles, permissions, groups

- **Roles** set hard boundaries — a student can never reach staff routes, period.
- **Permissions** are fine-grained grants within the staff panel (e.g. "view user accounts"), not
  one all-or-nothing admin switch. Can also be broad on purpose (e.g. "everything about accounts").
- **Super admin** — unrestricted, and the only role that can manage permission groups.
- **Admin** — access equals whatever their assigned **permission group** grants. No group (or a
  removed one) = no permissions. Fails safe.
- **Permission group** — a named, reusable bundle of permissions, created and assigned by super
  admins only. An admin can view groups and the permission catalog, but not edit either — letting
  admins edit their own group would let them grant themselves full access.

Changing an admin's group signs them out everywhere immediately, so a revoked permission can't
keep being used for the rest of a live session.

## Rate limiting

Sign-in and credential refresh are limited to a handful of attempts per minute per caller; every
other request uses the platform's normal, higher limit.

## Accepted trade-offs

- **Clients have no server-side session.** A compromised client credential is valid for up to 7 days
  and cannot be killed remotely — accepted, in exchange for clients needing no session at all.
- **Refresh tokens are not rotated.** A stolen moderator refresh token is usable for up to 10 hours
  alongside the real user, and the hash comparison cannot detect that it was stolen. Moderators are
  otherwise the opposite trade: shorter-lived, with sign-out effective on the very next request.

---

# Mechanics

## Endpoints

- `POST /auth/login` for clients, `POST /auth/moderators/login` for staff. Each rejects the other's
  roles with the same generic `401`.
- `POST /auth/refresh` issues a new access token only — no rotation. It `401`s on a bad signature,
  wrong token type, expiry, a soft-deleted user, or (moderators) a dead Redis session.
- `POST /auth/logout` deletes a moderator's session; for a client it is a `204` no-op.

## Tokens

- JWT access + refresh, signed with **separate secrets**; a `type` claim stops one being used as
  the other.
- Lifetimes as in the table above.

## Sessions

- Clients are stateless: no `sid`, nothing in Redis.
- Moderators carry a `sid` claim. The session lives in Redis with the refresh-token hash; one session
  holds exactly one refresh token and one or more access tokens.
- `AccessTokenGuard` validates the JWT and, for moderators, that the Redis session is alive — no
  database round trip either way. Deleting the session therefore kills both its refresh **and**
  access tokens immediately.
- Logout deletes one session. A group change, or an update to a group's permissions, revokes **all**
  sessions of every affected admin.

## Authorization internals

- `RolesGuard` and `PermissionsGuard` sit on top of the auth guard, each reading its own route
  metadata (`@Roles()` / `@Permissions()`), composed per controller with `@Auth()`.
- Permissions are `resource:action` strings with per-segment `*` wildcards (Apache Shiro
  convention), from a hardcoded catalog covering `users` and `groups`.
- An admin belongs to at most one group; their effective permissions are exactly the group's. A
  soft-deleted group grants nothing.
- `super_admin` bypasses every permission check. Group **writes** and **membership changes**
  (`PUT`/`DELETE /groups/:group_id/users/:user_id`) are `super_admin`-only; group **reads** accept
  `groups:read`, which an admin UI needs to render the catalog.
- `PermissionsGuard` refuses every client role outright, so `@Permissions` is safe without an
  accompanying `@Roles` — a forgotten `@Roles` cannot expose a route to a student or teacher.

## Glossary

- **Client** — student, teacher, or academy moderator.
- **Moderator** — admin or super admin.
- **Session** (moderator only) — the server-side record that makes a staff sign-in revocable.
- **Permission** — one specific grant of access.
- **Permission group** — a bundle of permissions assigned to an admin; their access, exactly.
