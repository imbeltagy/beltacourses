# Academies

- **Implements:** `022-academy-accounts`, `024-academy-course-workflow`, `035-academy-staff`
- **Status:** Proposed — nothing is built
- **Builds on:** [07-tenancy-and-courses.md](./07-tenancy-and-courses.md)

## Model

- `academies`: name, `tenant_id` (1:1 with a tenant of type `academy`), one academy wallet.
- `academy_staff`: `academy_id`, `user_id`, `role` (`owner` | `moderator`). Unique per `(academy, user)`;
  a partial unique index allows exactly one owner per academy.
- `academy_teachers`: `academy_id`, `teacher_id`, `status` (`active` | `removed`), `share` (nullable).
  Unique per `(academy, teacher)`.
- `invitations`: academy, `kind` (`teacher` | `moderator`), email, `invited_by`, `proposed_share`
  (teacher only, optional), token, status, expiry.

## Owner and moderator accounts

Every staff member is a normal account with the account role `academy_moderator`. Owner or moderator is
**not** an account role: it is the `role` on that person's `academy_staff` row, per academy.

- An account that is a moderator can never be a student, teacher, admin or super admin.
- One account can be staff of several academies, a moderator in one and the owner of another.
- Rights are always checked against the academy in the request: owner of A has nothing in B.
- Sign-up as an academy moderator, then create the academy, which makes the account its owner. Until the
  academy exists the account can do nothing else.

## Who can do what

| Action                                           | Owner | Moderator | Teacher        |
| ------------------------------------------------ | ----- | --------- | -------------- |
| Invite teachers                                  | yes   | yes       | no             |
| Invite or remove moderators                      | yes   | no        | no             |
| Plan and billing, wallet withdrawal              | yes   | no        | no             |
| Set a teacher's share                            | yes   | yes       | no             |
| Create a course                                  | yes   | yes       | yes, if active |
| Edit course content                              | yes   | yes       | own, if active |
| Set price, publish, back to draft, close, delete | yes   | yes       | no             |

## Invitations

- Teacher invitations: owner or moderator. Moderator invitations: owner only.
- Existing account: the invitation shows in their account. No account yet: the email link goes to
  sign-up, then accepting links them.
- The invitee's account role is checked **when they accept** (`academy_moderator` for a moderator
  invitation, `teacher` for a teacher one), never when the invitation is sent, so sending reveals nothing
  about an email's role.
- Accepting a teacher invitation creates an `active` membership, takes `proposed_share` if present, and
  checks the academy's size tier (023) at that moment. Accepting a moderator invitation creates the
  `academy_staff` row.
- A removed teacher can be invited again: the old membership is reactivated and its share is reset to the
  new invitation's.

## Profit

- One `share` per teacher per academy, set by the owner or a moderator, applying to all that teacher's
  courses there. There is no per-course override.
- The system fee comes off first. `teacher = share × (price − system fee)`, and the academy keeps the rest.
  `share` is between 0 and 100.
- A course whose author has no share cannot be published. A course with no author has no teacher share,
  so the academy keeps the whole remainder.
- The split is **snapshotted in each transaction**. Changing a share affects future sales only, and
  refunds (015) reverse the amounts actually paid.

## Courses

- `courses.tenant_id` is the academy's tenant; `author_id` is the teacher, or null for a course made by
  staff.
- Teachers control content only. Price, publishing, disabling and deletion belong to staff, whether or
  not the teacher is still in the academy. Disabling follows the normal lifecycle: back to draft if
  nothing has been bought, otherwise close (009, 034).

## Removing a teacher

- The membership becomes `removed`. The teacher can no longer create courses there, and loses edit
  access to their existing ones there. Staff edit on their behalf.
- Their courses stay with the academy, and the academy alone decides whether to disable them.
- The `share` stays on the membership and keeps applying to future sales of their courses until staff
  change it, which can include setting it to 0.

## Open

- Transferring ownership, and what happens if the owner's account is deleted.
- Removing the last moderator, and deleting an academy.
- Downgrading to a smaller size tier while there are more teachers than it allows.
