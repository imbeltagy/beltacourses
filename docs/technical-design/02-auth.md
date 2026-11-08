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
| Remote sign-out | yes, takes effect within 30 min     | yes, instant             |

Different risk profiles: a compromised student account is a nuisance, a compromised admin account
can touch everyone's data. Staff get a shorter leash and an instant kill switch. Both sign-in flows
return the identical "invalid email or password" for a wrong password _and_ for using the wrong
flow — the public app never reveals that an address belongs to staff.

## Staying signed in

A short-lived credential proves identity on every request; a longer-lived one silently gets a new
pair without a password. Invisible in normal use — refreshed automatically. Each refresh credential
works once: using it returns a new one.

|                                                  | Clients       | Moderators          |
| ------------------------------------------------ | ------------- | ------------------- |
| Short-lived, refreshed automatically             | 30 min        | 5 min               |
| Total lifetime before a real sign-in is required | 7 days        | 10 hours            |
| Remote "sign out everywhere"                     | within 30 min | instant, everywhere |

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

Changing an admin's group, or the permissions of their group, signs them out everywhere
immediately, so a revoked permission can't keep being used for the rest of a live session.

## Rate limiting

Sign-in and credential refresh are limited to a handful of attempts per minute per caller; every
other request uses the platform's normal, higher limit.

## Accepted trade-offs

- **A client access token outlives a remote sign-out.** Clients have a server-side session, so it
  can be ended, but the guard does not look the session up for clients (no Redis round trip on the
  hottest path). The access token already issued stays valid until it expires, at most 30 minutes;
  the next refresh fails.
- **Moderator permissions are a snapshot.** The session stores role, group and permissions at
  sign-in and at every refresh, so a permission check needs no database read. Every change that
  could alter them revokes the affected sessions, which is what keeps the snapshot honest.
- **A stolen refresh token is detected late.** Rotation is single-use, so whoever refreshes second
  is rejected and the loser gets a `401` — but the real user is signed out only when they next
  refresh, and the thief holds a working pair until then.

---

# Mechanics

## Endpoints

- `POST /auth/login` for clients, `POST /auth/moderators/login` for staff. Each rejects the other's
  roles with the same generic `401`. Both return `{ access_token, refresh_token, token_type,
expires_in, refresh_expires_in }`.
- `POST /auth/refresh` rotates: it returns a new access **and** refresh token on the same session
  id, with the same response shape as login. It `401`s (`INVALID_REFRESH_TOKEN`) on a bad
  signature, wrong token type, expiry, a missing session, a user that does not match the session, a
  hash mismatch, a lost rotation race, or a soft-deleted user (whose session it also removes).
- `POST /auth/logout` deletes the caller's own session, for clients and moderators alike. Other
  sessions of the same user are untouched.
- `DELETE /users/:id/group` (`super_admin`) unassigns an admin's group, next to the existing
  `PUT /users/:id/group`.

## Tokens

- JWT access + refresh via `@nestjs/jwt`, signed with **separate secrets** (`ACCESS_TOKEN_SECRET`,
  `REFRESH_TOKEN_SECRET`). `TokensUtil` (`apps/api/src/iam/modules/auth/tokens.util.ts`) is the only code
  that signs or verifies.
- Header `alg` is pinned to `HS256` on sign and verify; any other algorithm is rejected. Header `typ`
  is `at+jwt` for access and `rt+jwt` for refresh, and verify rejects a mismatch, so one cannot be
  used as the other. No `kid`: there is one key per token kind.
- Access claims: `sub`, `sid`, `role`, `email`, `name`, `iss`, `aud`, `iat`, `exp`. Refresh claims:
  `sid`, `userId`, `jti`, `iss`, `aud`, `iat`, `exp`. The refresh `jti` is a random UUID per token:
  without it two refreshes in the same second would sign identical tokens (same hash), which would
  defeat single-use rotation.
- `aud` is the `API_DOMAIN` env. `iss` is `${API_DOMAIN}/auth/login` for clients and
  `${API_DOMAIN}/auth/moderators/login` for moderators. Both are computed in the `TokensUtil`
  constructor, which throws one error naming every missing env, never at import time.
- Verification checks signature, `alg`, `typ`, `aud` and that `iss` is one of the two. The guard
  additionally requires the role to match the issuer: a moderator role only under the moderators
  issuer, a client role only under the clients issuer.
- Lifetimes as in the table above.

## Sessions

- Every sign-in, client or moderator, creates a session with a random `sid`, carried in both tokens.
- `session:{sid}` in Redis holds JSON `{ userId, role, groupId, permissions, hashedRefreshToken }`
  with a TTL equal to the refresh lifetime. `users-sessions:{userId}` is a Redis set of that user's
  `sid`s with the same TTL, so all of a user's sessions can be found and deleted.
- `hashedRefreshToken` is an HMAC-SHA256 (`REFRESH_TOKEN_HASH_SECRET`), base64url. The raw refresh
  token is never stored.
- Create is one `MULTI` (`SET EX`, `SADD`, `EXPIRE`); remove is `DEL` plus `SREM`; remove-all reads
  the set and deletes each key and then the set.
- Rotation is a Lua compare-and-swap in `SessionRepository.rotate`: it overwrites the session only if
  the stored hash still equals the one the caller presented, and resets the TTL. Of two concurrent
  refreshes with the same token exactly one wins; the other gets `false` and a `401`.
- Refresh reloads the user from the database and the group's permissions from the database, then
  writes role, `groupId` and permissions into the rotated session. That is how a snapshot gets
  corrected between revocations.
- Logout deletes one session. Revocation (below) deletes all sessions of a user.

## Authorization internals

- One global `AuthGuard` (`APP_GUARD`, provided by `IamModule`) does authentication and authorization.
  Every route declares its access with `@Auth()`; there are no separate roles or permissions guards
  or decorators.
- `@Auth()` takes one options object: `public`, `roles`, `permissions`. `{ public: true }` skips
  authentication and sets `request.user` to `null`; it cannot carry `roles` or `permissions`.
  `{ public: false }` means any authenticated user. `@Auth({})` is a type error. It also adds the
  bearer-auth and `401`/`403` Swagger documentation unless the route is public.
- A route with no `@Auth()` metadata throws a plain error, so a forgotten decorator is a `500` wiring
  failure, never an open route. Login, register, refresh and health are `{ public: true }`.
- Order of decisions: no bearer token → `MISSING_ACCESS_TOKEN` `401`; verification fails (signature,
  `alg`, `typ`, `iss`, `aud`, role/issuer mismatch) → `INVALID_ACCESS_TOKEN` `401`; role not in the
  required roles → `FORBIDDEN` `403`.
- **Clients** pass on the token alone: no Redis lookup. A route that requires permissions is `403`
  for a client.
- **Moderators** (admin, super admin) need a live session: no session for `sid` →
  `SESSION_EXPIRED` `401`. An admin must hold every required permission in the session snapshot,
  else `403`; `super_admin` bypasses the permission check.
- `request.user` is `{ id, email, name, role, sid, groupId, permissions }`; for clients `groupId` is
  `null` and `permissions` is `[]`. `@CurrentUser()` returns it, or `null` on a public route.
- Permissions are `resource:action` strings with per-segment `*` wildcards (Apache Shiro
  convention), from a hardcoded catalog covering `users` and `groups`. Matching lives in
  `hasAllPermissions`.
- An admin belongs to at most one group; their effective permissions are exactly the group's.
  Deleting a group is permanent: its permissions cascade and its admins are left with no group, so
  they hold no permissions.
- Group **writes** and **membership changes** (`PUT` and `DELETE /users/:id/group`) are
  `super_admin`-only; group **reads** accept `groups:read`, which an admin UI needs to render the
  catalog.

## Code layout and orchestration

Auth, users and groups live together in `apps/api/src/iam/`, because tokens, guards and decorators
are used by one app. Nothing here is shared through `@repo/backend`.

```
controllers (auth, users, groups)  →  IamFacade  →  AuthService, SessionService,
                                                    UserService, GroupsService,
                                                    AccountEmailsService
AuthService     →  TokensUtil, PasswordService, SessionService
SessionService  →  SessionRepository  →  Redis
UserService     →  UserRepository, StorageService
GroupsService   →  GroupsRepository
```

- Controllers inject only `IamFacade`, even for pass-through CRUD.
- Sub-services never inject each other. `IamFacade` holds every rule that crosses them: loading
  permissions at login and refresh, revoking sessions, sending the account email. The modules for
  auth, user and groups export only their services; `IamModule` provides the facade, the three
  controllers and the global guard.
- The account-created email is sent from the facade by `AccountEmailsService`
  (`apps/api/src/email/`) after the user is created. A failure is logged and swallowed; it never
  fails the request.

## Revocation

The facade calls `SessionService.removeAllForUser` for every affected user when:

- an admin is assigned a group, or unassigned from one;
- a group's permissions change (the user ids are read first), or a group is deleted (the user ids
  are read before the delete, because the foreign key then sets `group_id` to null);
- a user is soft-deleted;
- a user's role changes.

Password reset will also revoke every session of the user once it exists (`032-password-reset`); the
facade carries a `TODO(T-018)` marker for it.

Deploy note: the session keys and the token claims changed, so every session that existed before the
rollout is invalidated once.

## Proposed: verify before saving (to do later)

Not built. Sign-up does not create a user until the email is verified.

- Registering stores a **pending registration** (email, tenant, hashed password, profile, expiry) or an
  equivalent signed token, and sends the verification email. No `users` row exists yet.
- Clicking the link creates the user, already confirmed.
- Nobody can squat someone else's email, and unverified attempts leave no junk rows.
- A registration for an email that already has an account gets the same response as a new one, so the
  form never reveals who has an account.
- Replaces the current flow, which creates the row first and sets `confirmed` later.
- Accounts stay separate per tenant (see [07-tenancy-and-courses.md](./07-tenancy-and-courses.md)), so
  the pending registration and its link carry the tenant.

## Glossary

- **Client** — student, teacher, or academy moderator.
- **Moderator** — admin or super admin.
- **Session** — the server-side record, one per sign-in, that makes a sign-in revocable.
- **Permission** — one specific grant of access.
- **Permission group** — a bundle of permissions assigned to an admin; their access, exactly.
