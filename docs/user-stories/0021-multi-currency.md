# US-0021 — Multi-currency

- **Phase:** Phase 2 — Teacher Platform & Monetization
- **Tasks:** T-022
- **Status:** Pending

## Story

As a student, I want to browse prices in my own currency while the teacher keeps selling in his, so
that prices are readable to me and correct for him.

## Details

- The **teacher chooses the course currency** when publishing.
- The **student chooses a viewing currency** (defaulting from their region).
- Exchange rates are used **for display only**. The actual charge is made by Stripe in the course
  currency, and Stripe handles the conversion for the payer.
- A transaction stores the currency it happened in.
- A user wallet holds **an amount per currency**, and only currencies with a non-zero amount are kept.
  A per-currency amount may be **negative**.

## Acceptance criteria

- [ ] A course carries its own currency, set at publish time.
- [ ] Catalogue responses show converted prices plus the original currency and the rate used.
- [ ] Payments are created in the course currency; no conversion is done by us at charge time.
- [ ] Transactions record their currency.
- [ ] Wallet balances are stored per currency and can go negative.

## Notes

_None._
