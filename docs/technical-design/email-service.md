# Email service

- **Implements:** `006-email-service`
- **Status:** Implemented — a queue-backed SMTP replacement is proposed in [smtp-service.md](./smtp-service.md)

## Shape

`EmailService` in `@repo/backend/email`: `send(template, { to, locale, variables })`.

- Transport: nodemailer over Gmail (`NODEMAILER_USER`, `NODEMAILER_PASS`, `NODEMAILER_SENDER_EMAIL`).
- Templates: React Email in `@repo/frontend-emails`, rendered to `dist/<locale>/<name>.html` at build
  time. Nothing is rendered at request time.
- At send time `{{variable}}` placeholders are filled and **HTML-escaped**.
- Locale: `Accept-Language` through `@EmailLocaleParam()`; `en` and `ar` (rtl), unknown or missing → `en`.

## Failure policy

A send failure is logged and swallowed by the caller path: the triggering request (e.g. `POST /users`)
never fails because mail did. There is no retry or queue yet; a queue is the next step if delivery
guarantees become a requirement.

## Wired and waiting

Wired: staff-created account. Reset, verification and login-notification templates exist, waiting for
their endpoints (see business story `032-password-reset`).
