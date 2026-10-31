# Resource access

- **Implements:** `004-authZ`, and the access rules of `022-academy-accounts`, `024-academy-course-workflow`,
  `035-academy-staff`
- **Status:** Proposed — nothing is built
- **Builds on:** [02-auth.md](./02-auth.md), [07-tenancy-and-courses.md](./07-tenancy-and-courses.md),
  [08-academies.md](./08-academies.md)

Today a service checks access itself (e.g. "is this moderator in this academy?"). This moves every check
into `@Auth()`: the route declares the permissions it needs and which resources they apply to, and the
guard decides. Controllers and services hold no access checks. By the time a service runs, the caller is
already allowed. Built in-house, no authorization library.

## The annotation

`@Auth()` gains one option, `access`, next to `permissions`. It maps each resource to where its id is in
the request: a path param, a query param or a body field.

```ts
@Auth({
  permissions: ['lecture:update'],
  access: { lecture: { param: 'lectureId' } },
})
@Patch('lectures/:lectureId')
```

Permissions keep the `resource:action` shape. A required permission whose resource is listed in `access`
is checked **on that resource**. One whose resource is not listed is global, checked as today (an admin's
group, or `super_admin`).

## How the guard decides

For each resource in `access`:

1. Read its id from the param, query or body.
2. Load it with a **resolver**: the resource plus the fields its policy needs.
3. Ask its **policy** which permissions this user holds on it.

Add the user's global grants: everything for `super_admin`, the group's strings for an admin. Every
required permission must be held, or the request is refused.

So the policy never answers "which role is this?". It answers "what may this user do with this lecture?",
and the route only names what it needs.

## Example: a lecture

The lecture policy grants, per user:

| Who                                           | Granted on the lecture                             |
| --------------------------------------------- | -------------------------------------------------- |
| Anyone, if it is a preview of a public course | `lecture:read`                                     |
| A student who bought the course               | `lecture:read`                                     |
| The course's author, membership `active`      | `lecture:read`, `lecture:update`, `lecture:delete` |
| Owner or moderator of the course's academy    | `lecture:read`, `lecture:update`, `lecture:delete` |
| An admin                                      | Whatever their group holds, e.g. `lecture:read`    |
| `super_admin`                                 | Everything                                         |

Routes:

```ts
// Watch a lecture: buyer, author, academy staff, or an admin with lecture:read.
@Auth({
  permissions: ['lecture:read'],
  access: { lecture: { param: 'lectureId' } },
})
@Get('lectures/:lectureId')

// Edit it: the author while active, or academy staff. A buyer holds only lecture:read, so is refused.
@Auth({
  permissions: ['lecture:update'],
  access: { lecture: { param: 'lectureId' } },
})
@Patch('lectures/:lectureId')

// Copy a lecture into another course: two resources, one id from the body.
// Needs read on the source lecture and update on the target course.
@Auth({
  permissions: ['lecture:read', 'course:update'],
  access: {
    lecture: { param: 'lectureId' },
    course: { body: 'target_course_id' },
  },
})
@Post('lectures/:lectureId/copy')

// Invite a moderator: the academy policy grants academy:invite_moderator to its owner only.
@Auth({
  permissions: ['academy:invite_moderator'],
  access: { academy: { param: 'academyId' } },
})
@Post('academies/:academyId/moderators/invitations')

// Existing staff-panel route, unchanged: no access entry, so users:create is global.
@Auth({ permissions: ['users:create'] })
@Post('users')
```

## Rules

- **One resolver and one policy per resource type.** The policy is a pure function,
  `(user, resource) => Permission[]`, unit-tested without Nest or a database.
- **The loaded resource is attached to the request**, read in the controller with a param decorator
  (e.g. `@AccessResource('lecture')`), so the service does not fetch it again.
- **Body and query ids are untrusted.** Guards run before pipes, so the value has not been validated yet.
  A malformed id resolves to not found.
- A missing resource is `NOT_FOUND`. A resource the user holds no permission on is `FORBIDDEN`.
- A required permission whose resource is neither in `access` nor in the global catalog is a wiring bug.
  The guard throws a server error, as `RolesGuard` does today without `@Roles()`.
- Only some permissions can be put in an admin group (e.g. `lecture:read` for content review). The
  catalog marks which ones; `POST/PATCH /groups` still accepts only those.

## Nested resources

A course holds modules, and a module holds lectures. Access is decided **at the course**; a module or
lecture inherits it.

- `lectures` and `modules` store `course_id` (indexed) next to their parent id, so finding the course is
  one lookup with no joins. Lectures never move between courses, so the copy cannot drift.
- The lecture resolver loads the lecture's own fields (e.g. `is_preview`) and the course fields the policy
  needs (`tenant_id`, `author_id`, `status`), with the author's membership and the user's purchase.
- **Routes stay flat**: `GET /lectures/:lectureId`, not
  `/courses/:courseId/modules/:moduleId/lectures/:lectureId`. A nested URL would check access on
  `courseId` while the service still has to confirm the lecture belongs to that course. Forgetting that
  lets anyone with one course read any lecture by swapping ids. The flat route always takes the course from
  the lecture itself.
- A list scoped to a parent (`GET /courses/:courseId/lectures`) checks the parent once, then filters by
  `course_id`.

## Open

- Whether a refused read returns `NOT_FOUND` instead of `FORBIDDEN`, so it does not reveal the resource
  exists.
- Lists across parents (e.g. "every course I can edit"): the guard has no single resource to check there,
  so the repository filters by the user's memberships.
- Where purchases are read from once finance is its own service
  ([09-finance-service.md](./09-finance-service.md)).
