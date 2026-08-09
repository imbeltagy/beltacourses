# US-0014 — Refunds

- **Phase:** Phase 1 — MVP
- **Tasks:** T-014
- **Status:** Pending

## Story

As a student, I want to request a refund for a course I bought, so that I get my money back when the
course is not what I expected.

## Details

- Student opens a refund request against a purchase transaction.
- On approval:
  - the refunded amount is credited to the **student wallet**;
  - the teacher's share is **deducted from the teacher wallet**;
  - the platform's share is **deducted from the system wallet**.
- Course access is removed from the owned list once the refund is settled.

## Acceptance criteria

- [ ] A student can request a refund for an owned course, with a reason.
- [ ] An authorized reviewer can approve or reject the request.
- [ ] Approval moves money exactly as described above, as one atomic operation.
- [ ] The refunded course is removed from the student's owned list.
- [ ] A rejected request changes no balance.

## Notes

- Whether the system fee is fully refunded or partly kept is still undecided — see the Open decisions
  section of the roadmap.
