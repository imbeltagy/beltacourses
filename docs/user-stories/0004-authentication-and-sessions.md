# US-0004 — Authentication and Sessions

- **Phase:** Phase 1 — MVP
- **Tasks:** T-004
- **Status:** Done

## Story

As a user, I want to sign in with my email and password and stay signed in, so that I can use the
platform without logging in on every request.

## Details

- Email/password login, split into two endpoints: `POST /auth/login` for clients (student, teacher,
  academy_moderator) and `POST /auth/moderators/login` for staff (admin, super_admin). Each rejects
  the other's roles with the same generic `401`, so neither endpoint reveals whether an address
  belongs to staff.
- JWT access + refresh tokens, signed with separate secrets. Client tokens live 30 min (access) /
  7 d (refresh). Moderator tokens live 5 min (access) / 10 h (refresh).
- A `sid` claim and a Redis session apply **only to moderators**. A staff session can be revoked
  server-side (logout, or a permission/group change); a client session cannot.
- `POST /auth/refresh` issues a new access token only — there is no refresh-token rotation. It
  401s on a bad signature, wrong token type, expiry, a soft-deleted user, or (for moderators) a
  dead Redis session.
- `AccessTokenGuard` validates the JWT and, for moderators only, checks the session is still alive
  in Redis (no database round trip either way).
- `POST /auth/logout` deletes a moderator's Redis session, which invalidates both their refresh
  **and** access tokens immediately (the guard checks the session on every request). For a client
  it is a `204` no-op.

## Acceptance criteria

- [x] Login returns an access token and a refresh token, with role-appropriate lifetimes.
- [x] Client and moderator logins are separate endpoints and each rejects the other's roles.
- [x] The refresh endpoint issues a new access token; for a moderator only while the Redis session
      is valid and the presented refresh token matches the stored hash.
- [x] Moderator logout deletes the Redis session, which invalidates both that session's refresh
      **and** access tokens immediately.
- [x] Protected routes reject a missing, malformed, expired or (for moderators) revoked token.
- [x] Every session of one user can be revoked at once, and changing an admin's group does so.

## Notes

Two accepted trade-offs:

- **Clients have no server-side session.** A client cannot be logged out server-side, and a stolen
  client refresh token is valid for up to 7 days and cannot be revoked.
- **Refresh tokens are not rotated.** A stolen moderator refresh token is usable for up to 10 hours
  alongside the real user, and the hash comparison cannot detect that it was stolen.
