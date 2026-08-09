# US-0025 — Academy Course Workflow and Profit Split

- **Phase:** Phase 3 — Academies
- **Tasks:** T-027
- **Status:** Pending

## Story

As an academy, I want to own the pricing and the publishing decision for my teachers' courses, so
that the academy stays responsible for what is sold under its name.

## Details

- The **teacher** is responsible for creating and updating the course.
- The **academy** is responsible for accepting and publishing it, and may create or update a course on
  behalf of a teacher.
- The academy decides the **price** and the **teacher's profit share**, per course.
- Split model: the system already takes a fixed share of each purchase (e.g. 20%). The academy then
  decides how the remaining 80% is divided between the academy and the teacher, per course.

## Acceptance criteria

- [ ] A course belonging to an academy cannot be published by the teacher alone.
- [ ] A moderator can accept, reject or publish a teacher's course, and can edit it.
- [ ] Price and teacher share are set per course by the academy and validated (shares sum to the
      non-system remainder).
- [ ] A purchase credits system, academy and teacher wallets according to that split.

## Notes

_None._
