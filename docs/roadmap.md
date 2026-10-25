# Roadmap

Task board for the courses platform. Every task links to the business user stories in
[`docs/user-stories/`](./user-stories/). How a story is built lives in
[`docs/technical-design/`](./technical-design/) — this page stays a board.

## Legend

| Status        | Meaning                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `Pending`     | Not started.                                                                                                                             |
| `In progress` | Actively being built.                                                                                                                    |
| `Blocked`     | Started (or ready) but cannot move until a dependency or external decision is resolved. Reason **must** be written in the Notes section. |
| `Done`        | Merged, tested and usable.                                                                                                               |

Rules:

- A task that is `Blocked` must have an entry in [Notes](#notes) explaining why and what unblocks it.
- `Depends on` lists tasks that must be `Done` (or usable) before this one can finish.
- A task may cover several user stories, and a story may be split across several tasks, but prefer a
  story with at most one task.
- Task and story ids are append-only: a new task takes the next free id and is placed in the phase it
  belongs to, so ids are not always in reading order.

---

## Phase 1 — MVP

| #     | Task                                                                                                               | Story                                                                    | Status  | Depends on          |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------- | ------------------- |
| T-001 | File upload service                                                                                                | [005](./user-stories/005-file-upload.md)                                 | Done    | —                   |
| T-002 | Email service                                                                                                      | [006](./user-stories/006-email-service.md)                               | Done    | —                   |
| T-003 | Users CRUD + get profile (roles: student, teacher, academy moderator, admin, super admin)                          | [001](./user-stories/001-users.md)                                       | Done    | T-001               |
| T-004 | Authentication — email/password login, refresh token, JWT + Redis session id, auth guard                           | [002](./user-stories/002-login.md)<br>[003](./user-stories/003-authN.md) | Done    | T-003               |
| T-005 | Authorization — roles guard, permissions, admin permission groups (RBAC)                                           | [004](./user-stories/004-authZ.md)                                       | Done    | T-004               |
| T-006 | Video upload service                                                                                               | [007](./user-stories/007-video-upload.md)                                | Pending | T-001               |
| T-007 | Course creation — courses, modules, lectures                                                                       | [008](./user-stories/008-course-authoring.md)                            | Pending | T-005, T-006        |
| T-008 | Course publish (instant) + revert to draft while unpurchased                                                       | [009](./user-stories/009-course-publishing.md)                           | Pending | T-007               |
| T-009 | System wallet + user wallets                                                                                       | [010](./user-stories/010-wallets.md)                                     | Pending | T-003               |
| T-010 | Student favourites list + owned list                                                                               | [011](./user-stories/011-student-course-lists.md)                        | Pending | T-008               |
| T-011 | Stripe payment (course purchase) + transactions                                                                    | [012](./user-stories/012-course-purchase.md)                             | Pending | T-009, T-010        |
| T-012 | Wallet withdrawal (teacher & student) via PayPal payout                                                            | [013](./user-stories/013-wallet-withdrawal.md)                           | Pending | T-009               |
| T-013 | Course progress tracker (lecture completion unlocks the next item + overall %)                                     | [014](./user-stories/014-progress-tracking.md)                           | Pending | T-010               |
| T-014 | Refund request + refund to student wallet, deduct from teacher & system wallet                                     | [015](./user-stories/015-refunds.md)                                     | Pending | T-011               |
| T-015 | Course close (hidden for everyone except students who already purchased)                                           | [034](./user-stories/034-course-closing.md)                              | Pending | T-008, T-010        |
| T-034 | Course analytics for teacher & admin (owners, purchases, refunds, anonymized transactions, per-lecture completion) | [031](./user-stories/031-course-analytics.md)                            | Pending | T-011, T-013, T-014 |

## Phase 2 — Teacher Platform & Monetization

| #     | Task                                                                               | Story                                          | Status  | Depends on   |
| ----- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ------- | ------------ |
| T-016 | Banners (image + optional link to teacher profile or course, shown in home swiper) | [016](./user-stories/016-banners.md)           | Pending | T-001, T-005 |
| T-017 | OAuth login                                                                        | [033](./user-stories/033-oauth-login.md)       | Pending | T-004        |
| T-018 | Password reset / forgot password                                                   | [032](./user-stories/032-password-reset.md)    | Pending | T-002, T-004 |
| T-019 | Teacher website (per-teacher site with only his courses)                           | [017](./user-stories/017-teacher-website.md)   | Pending | T-008        |
| T-020 | Exclusive content (tenant-scoped accounts on the teacher website)                  | [018](./user-stories/018-exclusive-content.md) | Pending | T-019        |
| T-021 | Teacher plans — free / website / exclusive                                         | [019](./user-stories/019-teacher-plans.md)     | Pending | T-019, T-020 |
| T-022 | Multi-currency (course currency, viewing currency, wallet balance per currency)    | [020](./user-stories/020-multi-currency.md)    | Pending | T-011, T-009 |
| T-023 | Offers & coupons (system-created vs teacher-created, first-purchase or all)        | [021](./user-stories/021-offers-coupons.md)    | Pending | T-011        |

## Phase 3 — Academies

| #     | Task                                                                                                  | Story                                                | Status  | Depends on          |
| ----- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------- | ------------------- |
| T-024 | Academy sign up                                                                                       | [022](./user-stories/022-academy-accounts.md)        | Pending | T-003               |
| T-025 | Academy plans + academy size tiers (≤10, ≤50, >50 teachers) with website/exclusive add-ons            | [023](./user-stories/023-academy-plans.md)           | Pending | T-021, T-024        |
| T-026 | Academy moderator account (wallet + teacher invitations)                                              | [035](./user-stories/035-academy-moderator.md)       | Pending | T-024, T-009        |
| T-027 | Academy course workflow — teacher authors, academy reviews/publishes, per-course price & profit split | [024](./user-stories/024-academy-course-workflow.md) | Pending | T-026, T-007, T-011 |

## Phase 4 — Live Courses & Assignments

| #     | Task                                                                             | Story                                                | Status  | Depends on   |
| ----- | -------------------------------------------------------------------------------- | ---------------------------------------------------- | ------- | ------------ |
| T-028 | Live courses — schedule, booking, delivery, recorded sessions                    | [025](./user-stories/025-live-courses.md)            | Pending | T-011, T-006 |
| T-029 | Publish a finished live course as a regular course (previous buyers keep access) | [026](./user-stories/026-live-course-to-recorded.md) | Pending | T-028        |
| T-030 | MCQ assignments per lecture with grades (non-blocking for progress)              | [027](./user-stories/027-mcq-assignments.md)         | Pending | T-013        |

## Phase 5 — AI

| #     | Task                                                  | Story                                               | Status  | Depends on   |
| ----- | ----------------------------------------------------- | --------------------------------------------------- | ------- | ------------ |
| T-031 | AI lecture assistant (ask, summarize, hint, explain)  | [028](./user-stories/028-ai-lecture-assistant.md)   | Pending | T-007        |
| T-032 | Written assignments graded by AI                      | [029](./user-stories/029-ai-written-assignments.md) | Pending | T-030, T-031 |
| T-033 | Support chat bot for guests & users + support tickets | [030](./user-stories/030-support-chatbot.md)        | Pending | T-031        |

---

## Notes

Reasons for `Blocked` tasks, open decisions and anything that explains a status. Add an entry
whenever a status changes to `Blocked`, and remove it once the task moves on.

| Task | Note                       |
| ---- | -------------------------- |
| —    | No blocked task right now. |

### Open decisions

- **Storage provider** (T-001, T-006): S3-compatible bucket assumed — the draft schema already models
  `File`, `MultiPartUpload`, `UploadedPart`. Provider/CDN not chosen yet.
- **Video delivery** (T-006): raw file streaming vs transcoding + HLS not decided; affects T-028.
- **Payout provider** (T-012): PayPal Payouts assumed; teacher payout onboarding flow not designed.
- **Refund split** (T-014): whether the system fee is refunded in full or partially kept is undecided.
- **Token transport** (T-004): refresh tokens are returned in the JSON body; an httpOnly-cookie
  transport for `apps/web` is deferred and is a controller-level change (`AuthService` never touches
  `Request`/`Response`, so it stays a controller-only change when this is revisited).
- **Rate-limit storage** (T-004): `ThrottlerModule` uses in-memory storage, so limits are per-replica.
  Switch to a Redis-backed store (e.g. `@nest-lab/throttler-storage-redis`, backed by the
  `RedisService` that now exists) before running more than one API instance.
- **`/queues` is unauthenticated** (T-001): Bull Board mounts outside Nest's guard pipeline (it is
  its own Express router mounted directly, not a Nest controller) and needs basic auth or an ingress
  rule before production.

### Current state of the repo

Turborepo workspace with `apps/api` (NestJS), `apps/web`, `apps/docs`, `packages/database` (Prisma)
and `packages/backend` (shared NestJS providers). T-001, T-003, T-004 and T-005 are `Done`: file
upload, users CRUD, JWT authentication with moderator Redis sessions, and roles/permissions-based
authorization with admin permission groups. `packages/database/prisma/drafts/` still holds an older,
inert draft schema (courses, wallets, offers, student lists, and an `AccessGroup`/`Permission` model
superseded by the `Group`/`GroupPermission` models T-005 introduced) — not the active schema, and not
imported by anything.
