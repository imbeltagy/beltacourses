# US-0003 — User Accounts and Profiles

- **Phase:** Phase 1 — MVP
- **Tasks:** T-003
- **Status:** Done

## Story

As a platform user, I want an account with a profile and a role, so that the system knows who I am
and what part of the product I belong to.

## Details

- CRUD for users plus a "get my profile" endpoint.
- Roles: `student`, `teacher`, `academy moderator`, `admin`, `super admin`.
- Profile picture / cover uses the file upload service (US-0001).

## Acceptance criteria

- [x] Users can be created, read, updated and deleted (soft delete where it matters).
- [ ] A logged-in user can fetch and update their own profile. — **deferred to T-004**, see Notes.
- [x] Every user carries exactly one role from the list above.

## Notes

- **`/users/me` is deferred to T-004.** Fetching "my own" profile needs a logged-in caller, and
  nothing can log in until sessions exist. T-003 ships `GET /users/:id` and `PATCH /users/:id`, so
  the capability is there — only the "me" shortcut and the ownership check are missing.
- **`POST /auth/login` issues no session** (T-003 decision D1). It verifies credentials and returns
  the profile; no token, cookie or server-side session until T-004.
- **Login does not check `confirmed`** (D2). Nothing can confirm a user until the email service
  (T-002) ships, so the gate would lock out every account. `confirmed` is set only through
  `PATCH /users/:id` for now (D3).
- **A deleted user's email stays taken** (D4). Re-registering a soft-deleted address returns `409`
  forever, so a deleted account's history can never reattach to a different person.
- **Passwords are not updatable** through `PATCH /users/:id` (D7) — changing one needs the current
  password, which belongs to T-004/T-018.
- **`POST /users` and `PATCH /users/:id` are the admin-facing pair** and take `multipart/form-data`,
  so a profile picture is uploaded in the same request as the rest of the profile. `avatar` (a file)
  and `avatar_id` (a file uploaded earlier through `POST /storage`) are mutually exclusive.
- **A role is chosen once, at creation.** `POST /users` accepts any role except `super_admin`, which
  is never created over HTTP; `PATCH` cannot change a role at all. Promotion and demotion are
  privileged acts that belong with the roles guard in T-005.
