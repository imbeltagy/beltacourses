# Tenancy and course ownership

- **Implements:** `008-course-authoring`, `017-teacher-website`, `018-exclusive-content`, `019-teacher-plans`, `022-academy-accounts`, `023-academy-plans`, `024-academy-course-workflow`, `035-academy-moderator`
- **Status:** Proposed — nothing is built

## Two scopes

"Tenant" covers two separate things. Keep them apart.

| Scope         | Decides                                              | Applies to                          |
| ------------- | ---------------------------------------------------- | ----------------------------------- |
| **Ownership** | Whose website lists a course, and who is paid        | Every teacher and academy, any plan |
| **Identity**  | Which accounts exist, plus purchases and progress    | **Exclusive tenants only**          |

On the website plan students use their main account (017), so there is no separate identity there.

## Model

- Every teacher and academy has a **tenant**, even on the free plan. A website is a capability of the
  tenant, not a different kind of tenant.
- `tenants`: `type` (`teacher` | `academy`), `plan` (`free` | `website` | `exclusive`), `exclusive`,
  `domain` or `slug`.
- `courses`: `tenant_id` (the owner) and `author_id` (the teacher).
- A course shared by a teacher and an academy belongs to the **academy tenant**, with the teacher as
  `author_id`, so the teacher stays credited and paid (024).
- **Exclusive is per tenant**, set by its plan. `courses.exclusive` is a copy of the tenant's value,
  kept in step by the plan change, only so listing queries stay a single indexed filter. It is never set
  on its own.

## Queries

| Where    | Filter                                       |
| -------- | -------------------------------------------- |
| Platform | `exclusive = false AND status = published`   |
| Website  | `tenant_id = X AND status = published`       |

Banners are tenant-scoped the same way: a website shows only its own (016, 017).

## Identity (exclusive tenants)

- `users.tenant_id` is nullable; `null` means the main platform. Email stops being globally unique and
  becomes unique per tenant, using two partial unique indexes (one for `tenant_id IS NULL`, one for
  `(tenant_id, email)`).
- Purchases, progress and wallet entries of an exclusive student carry the tenant.
- A main-platform account cannot enter an exclusive tenant, and the reverse. The tenant is a token claim
  and the auth guard rejects a mismatch with the request's tenant.

## Resolving the tenant

The request's domain or subdomain maps to a tenant. The platform domain means "no tenant". Tenant-scoped
reads and writes go through a shared repository layer that applies the tenant filter, so a query cannot
forget it.

## Academy invitations

`invitations`: academy, email, token, status (`pending`, `accepted`, `declined`, `expired`), expiry.

- Teacher has an account: the invitation shows in their account.
- No account yet: the email link goes to sign-up, then accepting links them to the academy.
- Accepting links teacher and academy. Removing the link leaves the academy's courses with the academy.

## Rules

- Teacher leaves an academy: the academy keeps the course; the teacher's own website does not list it;
  the teacher keeps the agreed share of past sales.
- An exclusive tenant cannot also sell on the main platform.
- Changing plan **out of** exclusive is blocked in the first version, because its students have isolated
  accounts that cannot reach the main platform.

## Open

- Migration path when a plan changes (exclusive to website or free), if it is ever allowed.
- Custom domains: DNS and certificate handling per website.
- Whether an academy's plan or the teacher's plan applies to a teacher's own courses while linked.
