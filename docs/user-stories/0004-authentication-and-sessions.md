# US-0004 — Authentication and Sessions

- **Phase:** Phase 1 — MVP
- **Tasks:** T-004
- **Status:** Pending

## Story

As a user, I want to sign in with my email and password and stay signed in, so that I can use the
platform without logging in on every request.

## Details

- Email/password login.
- Access token (JWT) + refresh token flow.
- A session id is stored in Redis and embedded in the JWT, so a session can be revoked server-side.
- Auth guard that validates the JWT and checks the session id is still alive in Redis.

## Acceptance criteria

- [ ] Login returns an access token and a refresh token.
- [ ] The refresh endpoint issues a new access token while the Redis session is valid.
- [ ] Logout (or session revocation) invalidates the Redis session and every token bound to it.
- [ ] Protected routes reject requests with a missing, expired or revoked session.

## Notes

_None._
