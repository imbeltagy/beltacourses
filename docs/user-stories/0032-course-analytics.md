# US-0032 — Course Analytics

- **Phase:** Phase 1 — MVP
- **Tasks:** T-034
- **Status:** Pending

## Story

As a teacher (or an admin), I want analytics for a course, so that I can see how it sells and where
students drop off.

## Details

**Sales figures**

- How many students **own** the course.
- How many **purchases** were made.
- How many **refunds** happened (US-0014).
- The list of **transactions** for the course — **without student details**: amount, currency, date,
  status, and the platform/teacher split, but no identity of the buyer.

**Engagement**

- How many students completed **each lecture** (US-0013), meant to be rendered as a graph so the
  drop-off point is visible.

**Access**

- A teacher sees analytics for his own courses only.
- An admin with the right scope (US-0005) sees them for any course.

## Acceptance criteria

- [ ] A course analytics endpoint returns owners count, purchases count and refunds count.
- [ ] The transaction list for a course exposes no student identity or contact data.
- [ ] Per-lecture completion counts are returned in course/module/lecture order, ready to plot.
- [ ] A teacher requesting another teacher's course analytics is rejected.
- [ ] An admin needs the analytics scope to read them.

## Notes

- "Owns" and "purchased" differ once refunds exist: a refunded purchase still counts as a purchase but
  no longer as an owner.
