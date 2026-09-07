# Authentication & Authorization

Design-level reference: what the system does and why, and what a user or admin experiences. No
code — see `docs/user-stories/0004-*.md` / `0005-*.md` for acceptance criteria, the codebase for
implementation.

## Two account tiers

| | Clients | Moderators |
| --- | --- | --- |
| Roles | student, teacher, academy moderator | admin, super admin |
| Who | the public | staff |
| Sign in at | the public app | a separate staff sign-in |
| Remote sign-out | no | yes |

Different risk profiles: a compromised student account is a nuisance, a compromised admin account
can touch everyone's data. Staff get a shorter leash and a kill switch. Both sign-in flows return
the identical "invalid email or password" for a wrong password *and* for using the wrong flow — the
public app never reveals that an address belongs to staff.

## Staying signed in

A short-lived credential proves identity on every request; a longer-lived one silently gets a new
short-lived one without a password. Invisible in normal use — refreshed automatically.

| | Clients | Moderators |
| --- | --- | --- |
| Short-lived, refreshed automatically | 30 min | 5 min |
| Total lifetime before a real sign-in is required | 7 days | 10 hours |
| Remote "sign out everywhere" | not possible | instant, everywhere |

**Trade-off:** a compromised client credential is valid for up to 7 days with no way to kill it
remotely — accepted, in exchange for clients needing no server-side session at all. Moderators get
the opposite trade: shorter-lived, but a "sign out" (manual, or triggered by an access change below)
takes effect on the very next request, everywhere.

## Authorization: roles, permissions, groups

- **Roles** set hard boundaries — a student can never reach staff routes, period.
- **Permissions** are fine-grained grants within the staff panel (e.g. "view user accounts"), not
  one all-or-nothing admin switch. Can also be broad on purpose (e.g. "everything about accounts").
- **Super admin** — unrestricted, and the only role that can manage permission groups.
- **Admin** — access equals whatever their assigned **permission group** grants. No group (or a
  removed one) = no permissions. Fails safe.
- **Permission group** — a named, reusable bundle of permissions, created and assigned by super
  admins only. An admin can view groups and the permission catalog, but not edit either — letting
  admins edit their own group would let them grant themselves full access.

Changing an admin's group signs them out everywhere immediately, so a revoked permission can't
keep being used for the rest of a live session.

## Rate limiting

Sign-in and credential refresh are limited to a handful of attempts per minute per caller; every
other request uses the platform's normal, higher limit.

## Glossary

- **Client** — student, teacher, or academy moderator.
- **Moderator** — admin or super admin.
- **Session** (moderator only) — the server-side record that makes a staff sign-in revocable.
- **Permission** — one specific grant of access.
- **Permission group** — a bundle of permissions assigned to an admin; their access, exactly.
