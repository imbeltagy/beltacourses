# US-0011 — Course Purchase with Stripe

- **Phase:** Phase 1 — MVP
- **Tasks:** T-011
- **Status:** Pending

## Story

As a student, I want to buy a course with my card, so that I get immediate access to its content.

## Details

- Stripe checkout/payment intent for a single course purchase.
- Webhook-driven confirmation — access is granted only after Stripe confirms.
- Every purchase writes a transaction record and splits the amount between the teacher wallet and the
  system wallet (US-0009) using the configured system fee.

## Acceptance criteria

- [ ] A student can pay for a published course.
- [ ] On webhook confirmation the course is added to the owned list and a transaction is stored.
- [ ] Teacher and system wallets are credited with their shares.
- [ ] Failed or abandoned payments grant no access and leave no owned-list entry.
- [ ] Webhook handling is idempotent.

## Notes

_None._
