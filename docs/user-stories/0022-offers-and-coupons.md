# US-0022 — Offers and Coupons

- **Phase:** Phase 2 — Teacher Platform & Monetization
- **Tasks:** T-023
- **Status:** Pending

## Story

As the platform or as a teacher, I want to run offers and coupons, so that we can attract students —
each side paying for the discount it created.

## Details

- An offer has a value, an optional date window and an optional usage limit; it may be attached to a
  coupon code.
- Audience: **first-time students only** or **all students**.
- Revenue rule:
  - offer created by the **system** → the teacher still receives his **full** amount, the platform
    absorbs the discount;
  - offer created by the **teacher** → the teacher receives his profit **after** the discount.

## Acceptance criteria

- [ ] Offers can be created by the system and by teachers, with the owner recorded.
- [ ] Coupon codes are unique and validated at checkout (window, limit, audience).
- [ ] First-purchase offers are refused for students who already bought something.
- [ ] The purchase split follows the owner rule above.

## Notes

_None._
