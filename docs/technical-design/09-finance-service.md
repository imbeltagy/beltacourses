# Finance service

- **Implements:** `010-wallets`, `012-course-purchase`, `013-wallet-withdrawal`, `015-refunds`, `020-multi-currency`
- **Status:** Proposed — nothing is built

`apps/finance` is a small API in front of Formance Ledger. It is the only thing that talks to the
ledger, and it exposes a few strict endpoints, one per business case, never raw ledger access.

## Split of responsibility

- **`apps/api`** owns payments (Stripe, later Paymob and manual ones): amount, provider, status, order.
- **`apps/finance`** owns money movement: who holds what, in which currency.
- The two are matched by an id. The app generates one `reference` per business event (e.g. the payment
  id) and sends it to finance. Finance uses it as the ledger idempotency key and stores it on the
  transaction, so a retried call never posts twice and any payment can be found in the ledger.

## Accounts

One Formance ledger. The accounts below are illustrative, to explain the model; the final set is decided
when it is built. Addresses carry the owner, never the currency (that is the asset):

| Address                 | Holds                               |
| ----------------------- | ----------------------------------- |
| `world`                 | outside the system (provider, bank) |
| `users:<id>:wallet`     | a user's balance (student, teacher) |
| `academies:<id>:wallet` | an academy's balance                |
| `platform:revenue`      | the platform's cut                  |

## Endpoints

Illustrative too: they show the shape (one strict endpoint per business case), not a final API.

| Endpoint                | Ledger effect                                                      |
| ----------------------- | ------------------------------------------------------------------ |
| `POST /deposits`        | `world` → student wallet (a payment was confirmed)                 |
| `POST /purchases`       | student wallet → platform, academy (if any), teacher, by the split |
| `POST /refunds`         | reverses the purchase: beneficiaries → the **student wallet**      |
| `POST /withdrawals`     | wallet → `world` (a payout was sent)                               |
| `GET /wallets/:ownerId` | balances, one per currency                                         |

Each write takes `reference`, amounts as integer minor units, and an asset such as `USD/2`. Finance
computes nothing about prices; the app sends the split (or the rule id) and finance checks it sums to
the total.

## Failures and retries

If the app saves a payment but the call to finance fails, the order is paid with no money movement. The
app therefore never fires and forgets: it records the call as pending and a queue retries it until
finance confirms. Retrying is safe because every write is idempotent on `reference`. Finance uses the
same pattern for its own ledger calls.

## Negative balances

A refund after the teacher has withdrawn leaves their wallet negative. We accept this: the debt is
recovered from future sales. If the teacher leaves without repaying, the platform absorbs the loss; it is
rare. Withdrawals still cannot overdraw a wallet, so only a refund can push a balance below zero.

## Purchase is two transactions

1. **Deposit:** `world` → student wallet.
2. **Purchase:** student wallet → beneficiaries.

A refund reverses step 2 only. The money lands in the student's wallet, not back in `world`, so the
student can spend it in the app or withdraw it later. This also keeps the provider payment (step 1)
and the course sale (step 2) independent.

## Currencies

- **MVP:** one currency. Stripe converts to ours, so the ledger sees a single asset.
- **Later:** Paymob and manual payments (InstaPay, wallets) arrive in the payer's currency. Because the
  asset is part of every amount, nothing in the account layout changes. The new work is a conversion
  step: an `exchanges` endpoint that moves value between two assets through `platform:exchange`, with
  the rate recorded in transaction metadata.

## Open ideas

Things we may build, or may not.

- Cached balances in the app, refreshed from finance, to avoid a call on every page.
- Platform-wide reports built from ledger metadata (revenue per academy, per currency).
