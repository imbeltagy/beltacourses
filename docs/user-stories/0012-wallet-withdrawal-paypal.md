# US-0012 — Wallet Withdrawal via PayPal Payout

- **Phase:** Phase 1 — MVP
- **Tasks:** T-012
- **Status:** Pending

## Story

As a teacher or student, I want to withdraw my wallet balance to PayPal, so that I can take my money
out of the platform.

## Details

- Withdrawal request against an available balance, paid out through PayPal Payouts.
- The requested amount is held/debited when the request is created so it cannot be spent twice.
- Payout result (success/failure) updates the request and, on failure, returns the amount.

## Acceptance criteria

- [ ] A user can request a withdrawal up to their available balance.
- [ ] Requests above the available balance are rejected.
- [ ] A successful payout marks the request as paid and keeps a ledger entry.
- [ ] A failed payout restores the balance.

## Notes

_None._
