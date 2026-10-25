# SMTP service

- **Implements:** `006-email-service`
- **Status:** Proposed — replaces the Gmail transport in [email-service.md](./email-service.md)

## Design

```
caller → EmailService.send() → email queue (BullMQ) → EmailProcessor → SmtpAdapter → SMTP server
```

- `send()` only enqueues, so a mail failure never touches the calling request.
- `SmtpAdapter` is the only class that talks SMTP, configured by `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
  `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER_EMAIL` (replacing `NODEMAILER_*`).
- **Retry:** 5 attempts, exponential backoff from 30s. Transient errors (timeout, `4xx`) retry; permanent
  ones (`5xx`, bad recipient) fail at once. A job that fails every attempt is logged and reported to
  `ErrorNotifier`.
- Completed jobs are removed immediately, since payloads can hold reset links.

## Environments

|      | Dev                                           | Prod                                                |
| ---- | --------------------------------------------- | --------------------------------------------------- |
| SMTP | Mailpit (`axllent/mailpit`), `localhost:1025` | Amazon SES, `eu-north-1`, via its SMTP endpoint     |
| Mail | Never delivered, read at `localhost:8025`     | Sent from `no-reply@<our domain>`                   |
| Auth | any user and password                         | SES SMTP credentials from secrets, TLS on 587       |

Prod needs: verified domain, DKIM, SPF and DMARC records, SES production access (new accounts are
sandboxed), and bounce/complaint handling over SNS to a webhook.

## Open

- Bounce/complaint webhook design.
- `/queues` is unauthenticated and must be secured before failed emails are inspected there.
