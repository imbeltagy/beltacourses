# Roadmap

Task board for the courses platform. Every task links to a user story in
[`docs/user-stories/`](./user-stories/). Details live in the story file — this page stays a board.

## Legend

| Status | Meaning |
| --- | --- |
| `Pending` | Not started. |
| `In progress` | Actively being built. |
| `Blocked` | Started (or ready) but cannot move until a dependency or external decision is resolved. Reason **must** be written in the Notes section. |
| `Done` | Merged, tested and usable. |

Rules:

- A task that is `Blocked` must have an entry in [Notes](#notes) explaining why and what unblocks it.
- `Depends on` lists tasks that must be `Done` (or usable) before this one can finish.
- One user story can cover more than one task.
- Task and story ids are append-only: a new task takes the next free id and is placed in the phase it
  belongs to, so ids are not always in reading order.

---

## Phase 1 — MVP

| # | Task | Story | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-001 | File upload service | [US-0001](./user-stories/0001-file-upload-service.md) | Done | — |
| T-002 | Email service | [US-0002](./user-stories/0002-email-service.md) | Pending | — |
| T-003 | Users CRUD + get profile (roles: student, teacher, academy moderator, admin, super admin) | [US-0003](./user-stories/0003-user-accounts-and-profiles.md) | Done | T-001 |
| T-004 | Authentication — email/password login, refresh token, JWT + Redis session id, auth guard | [US-0004](./user-stories/0004-authentication-and-sessions.md) | Pending | T-003 |
| T-005 | Authorization — roles guard, scopes, admin scope groups (RBAC) | [US-0005](./user-stories/0005-authorization-rbac.md) | Pending | T-004 |
| T-006 | Video upload service | [US-0006](./user-stories/0006-video-upload-service.md) | Pending | T-001 |
| T-007 | Course creation — courses, modules, lectures | [US-0007](./user-stories/0007-course-authoring.md) | Pending | T-005, T-006 |
| T-008 | Course publish (instant) + revert to draft while unpurchased | [US-0008](./user-stories/0008-course-publishing-and-visibility.md) | Pending | T-007 |
| T-009 | System wallet + user wallets | [US-0009](./user-stories/0009-wallets.md) | Pending | T-003 |
| T-010 | Student favourites list + owned list | [US-0010](./user-stories/0010-student-course-lists.md) | Pending | T-008 |
| T-011 | Stripe payment (course purchase) + transactions | [US-0011](./user-stories/0011-course-purchase-with-stripe.md) | Pending | T-009, T-010 |
| T-012 | Wallet withdrawal (teacher & student) via PayPal payout | [US-0012](./user-stories/0012-wallet-withdrawal-paypal.md) | Pending | T-009 |
| T-013 | Course progress tracker (lecture completion unlocks the next item + overall %) | [US-0013](./user-stories/0013-course-progress-tracking.md) | Pending | T-010 |
| T-014 | Refund request + refund to student wallet, deduct from teacher & system wallet | [US-0014](./user-stories/0014-refunds.md) | Pending | T-011 |
| T-015 | Course close (hidden for everyone except students who already purchased) | [US-0008](./user-stories/0008-course-publishing-and-visibility.md) | Pending | T-008, T-010 |
| T-034 | Course analytics for teacher & admin (owners, purchases, refunds, anonymized transactions, per-lecture completion) | [US-0032](./user-stories/0032-course-analytics.md) | Pending | T-011, T-013, T-014 |

## Phase 2 — Teacher Platform & Monetization

| # | Task | Story | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-016 | Banners (image + optional link to teacher profile or course, shown in home swiper) | [US-0015](./user-stories/0015-banners.md) | Pending | T-001, T-005 |
| T-017 | OAuth login | [US-0016](./user-stories/0016-oauth-login.md) | Pending | T-004 |
| T-018 | Password reset / forgot password | [US-0017](./user-stories/0017-password-reset.md) | Pending | T-002, T-004 |
| T-019 | Teacher website (per-teacher site with only his courses) | [US-0018](./user-stories/0018-teacher-website.md) | Pending | T-008 |
| T-020 | Exclusive content (tenant-scoped accounts on the teacher website) | [US-0019](./user-stories/0019-exclusive-content-tenancy.md) | Pending | T-019 |
| T-021 | Teacher plans — free / website / exclusive | [US-0020](./user-stories/0020-teacher-plans.md) | Pending | T-019, T-020 |
| T-022 | Multi-currency (course currency, viewing currency, wallet balance per currency) | [US-0021](./user-stories/0021-multi-currency.md) | Pending | T-011, T-009 |
| T-023 | Offers & coupons (system-created vs teacher-created, first-purchase or all) | [US-0022](./user-stories/0022-offers-and-coupons.md) | Pending | T-011 |

## Phase 3 — Academies

| # | Task | Story | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-024 | Academy sign up | [US-0023](./user-stories/0023-academy-accounts.md) | Pending | T-003 |
| T-025 | Academy plans + academy size tiers (≤10, ≤50, >50 teachers) with website/exclusive add-ons | [US-0024](./user-stories/0024-academy-plans.md) | Pending | T-021, T-024 |
| T-026 | Academy moderator account (wallet + teacher invitations) | [US-0023](./user-stories/0023-academy-accounts.md) | Pending | T-024, T-009 |
| T-027 | Academy course workflow — teacher authors, academy reviews/publishes, per-course price & profit split | [US-0025](./user-stories/0025-academy-course-workflow.md) | Pending | T-026, T-007, T-011 |

## Phase 4 — Live Courses & Assignments

| # | Task | Story | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-028 | Live courses — schedule, booking, delivery, recorded sessions | [US-0026](./user-stories/0026-live-courses.md) | Pending | T-011, T-006 |
| T-029 | Publish a finished live course as a regular course (previous buyers keep access) | [US-0027](./user-stories/0027-live-course-to-recorded.md) | Pending | T-028 |
| T-030 | MCQ assignments per lecture with grades (non-blocking for progress) | [US-0028](./user-stories/0028-mcq-assignments.md) | Pending | T-013 |

## Phase 5 — AI

| # | Task | Story | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-031 | AI lecture assistant (ask, summarize, hint, explain) | [US-0029](./user-stories/0029-ai-lecture-assistant.md) | Pending | T-007 |
| T-032 | Written assignments graded by AI | [US-0030](./user-stories/0030-ai-graded-written-assignments.md) | Pending | T-030, T-031 |
| T-033 | Support chat bot for guests & users + support tickets | [US-0031](./user-stories/0031-support-chatbot-and-tickets.md) | Pending | T-031 |

---

## Notes

Reasons for `Blocked` tasks, open decisions and anything that explains a status. Add an entry
whenever a status changes to `Blocked`, and remove it once the task moves on.

| Task | Note |
| --- | --- |
| — | No blocked task right now. |

### Open decisions

- **Storage provider** (T-001, T-006): S3-compatible bucket assumed — the draft schema already models
  `File`, `MultiPartUpload`, `UploadedPart`. Provider/CDN not chosen yet.
- **Video delivery** (T-006): raw file streaming vs transcoding + HLS not decided; affects T-028.
- **Payout provider** (T-012): PayPal Payouts assumed; teacher payout onboarding flow not designed.
- **Refund split** (T-014): whether the system fee is refunded in full or partially kept is undecided.

### Current state of the repo

Turborepo workspace with `apps/api` (NestJS), `apps/web`, `apps/docs`, and `packages/database`
(Prisma). `packages/database/prisma/drafts/schema/` holds a draft schema covering users, courses,
files, wallets, offers and student lists — it is a draft, not the active schema, so no task above is
`Done` yet.
