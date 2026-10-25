# Technical design

The feature-level engineering layer: how each business story is built. System-level design (containers, how the apps talk, where it is deployed) belongs in `../architecture/` (not written yet). Business rules live in the user stories (`docs/user-stories/`) and say _what_ and _why_ for the business. These documents say _how_: storage,
queues, tokens, data models, trade-offs. A design doc may name vendors and libraries; a business story
must not.

Each document starts with a header:

- **Implements** — the business story it serves.
- **Status** — `Implemented`, `Proposed` or `Superseded`.

Other docs: [`../file-structure.md`](../file-structure.md) is the repo map.

| Document | Implements | Status |
| --- | --- | --- |
| [01-users.md](./01-users.md) | 001 Users | Implemented |
| [02-auth.md](./02-auth.md) | 003 AuthN, 004 AuthZ | Implemented |
| [03-email-service.md](./03-email-service.md) | 006 Email service | Implemented |
| [04-smtp-service.md](./04-smtp-service.md) | 006 Email service | Proposed |
| [05-file-upload.md](./05-file-upload.md) | 005 File upload | Implemented |
| [06-video-upload-and-fetching.md](./06-video-upload-and-fetching.md) | 007 Video upload, 014 Progress | Proposed |
