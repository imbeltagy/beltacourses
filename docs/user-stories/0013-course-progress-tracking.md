# US-0013 — Course Progress Tracking

- **Phase:** Phase 1 — MVP
- **Tasks:** T-013
- **Status:** Pending

## Story

As a student, I want to mark each lecture as complete to open the next one, so that I move through the
course in order and can see how far I am.

## Details

- The student marks a lecture as complete; that **unlocks the next item** in the course sequence.
- The sequence runs across modules: the last lecture of a module unlocks the first lecture of the
  next module.
- Assignments (quiz or written, US-0028 / US-0030) sit in the same sequence and are unlocked the same
  way. The student marks an assignment as complete to continue — **passing it is not required**.
- Overall progress percentage per course = completed items / total items.

## Acceptance criteria

- [ ] A student can mark a lecture complete, and the next lecture becomes accessible.
- [ ] A locked lecture cannot be opened, and its video/content is not served.
- [ ] The first lecture of a course is unlocked on purchase.
- [ ] Completion carries over module boundaries.
- [ ] An assignment can be marked complete regardless of its grade, and that unlocks what follows it.
- [ ] Course listing for an owned course returns the progress percentage.
- [ ] Progress is per student and per item, without duplicates.

## Notes

- Assumption: unlocking is one-way — a student can undo a completion (progress % drops), but an item
  that was already unlocked stays reachable. Flag it if it should re-lock instead.
- Demo lectures (US-0007) are outside the gate: they stay open to everyone.
