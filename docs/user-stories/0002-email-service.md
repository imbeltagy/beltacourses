# US-0002 — Email Service

- **Phase:** Phase 1 — MVP
- **Tasks:** T-002
- **Status:** Done

## Story

As the platform, I want to send localized transactional emails, so that users hear from us in their own language.

## Details

- `EmailService` in `@repo/backend/email`: `send(template, { to, locale, variables })`, nodemailer over Gmail, same `NODEMAILER_USER`/`NODEMAILER_PASS`/`NODEMAILER_SENDER_EMAIL` and headers as the previous backend.
- HTML comes from `@repo/frontend-emails` (`dist/<locale>/<name>.html`); `{{variable}}` placeholders are filled and HTML-escaped at send time.
- Locale comes from `Accept-Language` (`@EmailLocaleParam()`); unknown or missing falls back to `en`.
- Wired: `POST /users` emails the new user. Reset, verification and login-notification templates exist but wait for their endpoints (US-0017).

## Acceptance criteria

- [x] Emails are sent in `en` or `ar` (rtl) by `Accept-Language`, defaulting to `en`.
- [x] Account creation by staff emails the new user; a mail failure does not fail the request.

## Notes

_None._
