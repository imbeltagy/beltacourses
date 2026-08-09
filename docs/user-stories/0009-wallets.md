# US-0009 — Wallets

- **Phase:** Phase 1 — MVP
- **Tasks:** T-009
- **Status:** Pending

## Story

As the platform, I want a system wallet and a wallet per user, so that money moving between students,
teachers and the platform is always recorded somewhere.

## Details

- One system wallet holding the platform's share.
- One wallet per user (teacher earnings, student refunds).
- Every balance change is backed by a ledger entry, never a bare update.

## Acceptance criteria

- [ ] A wallet is created with the user account.
- [ ] Balance can be read by the owner and by authorized admins.
- [ ] Credits and debits are recorded as immutable entries; balance is derivable from them.

## Notes

_None._
