# US-0008 — Course Publishing and Visibility

- **Phase:** Phase 1 — MVP
- **Tasks:** T-008, T-015
- **Status:** Pending

## Story

As a teacher, I want to publish my course instantly, pull it back to draft while nobody has bought it,
and close it later, so that I control when it is sellable without hurting the students who already
bought it.

## Details

**Lifecycle** — a course starts as `draft` (US-0007), becomes `published`, and can later be closed.
`draft` courses are invisible to students and cannot be purchased.

**Publish (T-008)** — publishing is instant: no review step in the MVP. Once published, the course is
visible in the catalogue and can be purchased.

**Back to draft (T-008)** — a published course can be returned to `draft`, but **only while it has no
purchase**. As soon as one student has bought it, unpublishing is refused and the teacher must use
close (T-015) instead — that keeps the buyers' access intact.

**Close (T-015)** — the teacher closes the course:

- It disappears from the catalogue, search and every public listing.
- New purchases are refused.
- Students who already purchased it keep full access to it and to their progress.

## Acceptance criteria

- [ ] A `draft` course is not returned by any public/catalogue endpoint and cannot be purchased.
- [ ] Publishing flips the course to `published` and records `publishedAt`, with no approval step.
- [ ] A published course with zero purchases can be set back to `draft`.
- [ ] Setting a course back to `draft` is rejected once it has at least one purchase.
- [ ] A closed course is not returned by any public/catalogue endpoint.
- [ ] Purchase of a closed course is rejected.
- [ ] A student who owns a closed course can still open it and every lecture.

## Notes

_None._
