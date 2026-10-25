# File upload service

- **Implements:** `005-file-upload`
- **Status:** Implemented

## Shape

`StorageService` in `@repo/backend/storage` is the only writer to the S3 bucket. Every object has
exactly one metadata row in Postgres, and that row's id **is** the file id used everywhere else. Nothing
outside the module deals with buckets, keys or vendors.

```
controller (api) → StorageService → StorageRepository → Prisma
                                  → S3 adapter        → S3
```

## Upload

- One endpoint, always multi-file: request field and response are lists, order preserved. Bulk is the
  only shape so a single file is a one-element array.
- Per file: write the object, then create the row (name, mime type, size, key, `created_at`, `url`).
- **Compensating delete:** if the row write fails after the object write succeeded, the service removes
  the object, so no bucket object exists without a row.

## Delete

- **Soft delete** sets `deleted_at` and nothing else. It is O(1) per file, which is why bulk delete stays
  fast: a hard delete is one S3 round trip per object and would grow with the request size.
- Bulk and tolerant: unknown or already-deleted ids are skipped, the response lists the ids that changed.
  The `where` includes `deleted_at: null` so the original timestamp is never overwritten.
- **Hard delete** (object + row) has no HTTP endpoint. Only the cleanup worker calls it. With no auth at
  the time of writing, an HTTP hard delete would have been a public irreversible operation.

## Cleanup worker

- BullMQ `FileCleanupProcessor`, schedule registered with `upsertJobScheduler` in `onModuleInit`
  (weekly, Sunday 00:00). No retention window: a soft-deleted file goes on the next run.
- Pages through rows (100 per page) so memory stays bounded for any backlog.
- Idempotent: an object already gone from S3 still has its row removed; a crash mid-page is safe to
  re-run. A failing file is logged and left for the next run; the run reports removed/failed counts.

## Decisions

| Decision                           | Why                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Stable public `url` column         | Phase 1 content (avatars, banners, covers) is public. Private files: see video doc. |
| Weekly cleanup, no retention       | Matches the previous service. Cost: a soft delete is unrecoverable within a week.   |
| No size / mime allow-list yet      | Configuration, not code. The old service never enforced one either. Still open.     |
| Ownership checks left to consumers | The service has no notion of owners; feature modules add access rules.              |
