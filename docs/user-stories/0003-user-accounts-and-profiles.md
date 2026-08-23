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
- [x] A logged-in user can fetch and update their own profile.
- [x] Every user carries exactly one role from the list above.

## Notes

_None._
