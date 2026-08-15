# US-0001 — File Upload Service

- **Phase:** Phase 1 — MVP
- **Tasks:** T-001
- **Status:** Done

## Story

As a platform service (and, through it, any feature that needs to store a file), I want to upload one
or many files in a single request and get back a stable id and a URL for each one, so that other
modules (profiles, banners, courses, videos) can reference a file by id without knowing anything
about the underlying object storage.

## Details

The service is the only writer to the storage bucket. Every stored object has exactly one metadata
row in our database; that row's id **is** the file id returned to callers and used everywhere else in
the system. Nothing outside this module deals with buckets, keys or storage vendors.

**Upload**

- One endpoint, always multi-file: the request field is a list and the response is a list, so a
  single file comes back as a one-element array.
- The response is a list, one entry per uploaded file, each containing at least the file `id` and a
  `url`. The order of the response matches the order of the uploaded files.
- Each upload writes the object to the bucket and creates the metadata row. Metadata includes the
  original file name, mime type, size, the storage key, and the created timestamp.
- The upload is all-or-nothing per file: if the object write succeeds but the metadata write fails,
  the orphaned object is removed, so a bucket object never exists without a row pointing at it.

**Read**

- Get a file by id returns its metadata plus the URL.
- A soft-deleted file is treated as missing by the normal read path.

**Delete**

- **Soft delete** sets `deletedAt` on the metadata row. The object stays in the bucket and the row
  stays in the table, but the file stops being readable through the service. This is the delete that
  feature modules call, and the only one reachable over HTTP.
- The delete endpoint is **bulk** — it takes a list of ids. Ids that are unknown or already deleted
  are skipped rather than failing the call, and the response says which ids actually changed.
- Re-deleting an already soft-deleted file does not move its original `deletedAt`.
- **Hard delete** removes the object from the bucket and the metadata row from the database. It is
  irreversible, has **no HTTP endpoint**, and is called only by the cleanup worker.

**Scheduled cleanup**

- A BullMQ worker runs once a week and hard-deletes every file with a non-null `deletedAt`. There is
  no retention window: a soft-deleted file is removed on the next weekly run.
- One run clears the whole backlog, paging through the rows so memory stays bounded regardless of how
  many files are pending.
- The job is repeatable and idempotent: a re-run, an overlapping run, or a crash mid-page must not
  corrupt state — a file already gone from the bucket still gets its row removed, and a file already
  removed from the database is not visited twice.
- A file that fails to delete is logged and left in place for the next run; it does not abort the
  rest of the run. The worker logs how many files were removed and how many failed.

## Acceptance criteria

- [x] Uploading a single file returns a one-entry list containing the file id and a working URL.
- [x] Uploading several files in one request returns one entry per file, in the same order.
- [x] The returned id resolves to a metadata row in our database describing that exact object.
- [x] Get by id returns the metadata and URL for a live file.
- [x] Get by id for an unknown id returns not-found.
- [x] Get by id for a soft-deleted file returns not-found.
- [x] Soft delete sets `deletedAt`, leaves the object in the bucket, and makes the file unreadable
      through the service.
- [x] Soft-deleting an already soft-deleted file does not change the original `deletedAt`.
- [x] Bulk soft delete accepts a list of ids and reports back only the ids that actually changed;
      unknown ids do not fail the request.
- [x] Hard delete is not reachable over HTTP.
- [x] Hard delete removes both the bucket object and the metadata row.
- [x] Hard delete of an id that is already gone from the bucket still removes the row and does not
      error.
- [x] A weekly BullMQ repeatable job exists and hard-deletes every soft-deleted file.
- [x] One cleanup run clears a backlog larger than a single page.
- [x] Running the cleanup job twice in a row is safe and the second run removes nothing extra.
- [x] One file failing to delete does not stop the rest of the cleanup run.
- [x] A failed object write leaves no metadata row; a failed metadata write leaves no bucket object.
- [ ] Files that exceed the configured size limit, or whose mime type is not allowed, are rejected
      with a clear error and nothing is written. _(deferred — see Notes)_

## Notes

This story is a rewrite of an existing service (`courses/backend/src/storage`). Behaviour was
compared against it; the implementation plan lives in [`plan.md`](../../plan.md) and marks every
deliberate difference. The old service's multipart/resumable video upload is **not** in scope — that
is T-006.

How the criteria above were checked: all but one were exercised against the real bucket
(`beltacourses`, `eu-north-1`) and the local Postgres/Redis — upload, read, soft delete, the repeat
delete, and a triggered cleanup run that removed the objects and the rows. The exception is *"one
cleanup run clears a backlog larger than a single page"*, which is covered by a unit test that drains
pages of 100 + 100 + 0 in one run; no live backlog of more than 100 files was staged. Unit tests
(64 in total, across `@repo/service` and `api`) cover the failure paths that are impractical to
provoke against real S3: the compensating delete after a failed metadata write, a single file failing
mid-run, and a fully-failing page terminating the loop.

Settled:

- **No retention window.** Soft-deleted files are hard-deleted on the next weekly run, matching the
  old service. The trade-off is that a soft delete is unrecoverable within a week.
- **Cadence is weekly**, Sunday 00:00, matching the old service.
- **Hard delete stays off the API.** With no auth until T-005, an HTTP hard-delete would be a
  publicly reachable irreversible operation.
- **URLs are public and stable.** The `File` model keeps its `url` column, matching the old service.
  Everything this story serves in Phase 1 is legitimately public — profile pictures (T-003), banners
  (T-016), course covers (T-007). Private content is **T-006's** problem to solve, and is recorded
  there: a stable public URL for a paid lecture leaks permanently once a buyer shares the link.

Open:

- **Size and mime allow-lists** are deferred — the old service never enforced them either
  (`MAX_VIDEO_SIZE` was declared and unused). They are configuration, not code. Video is handled
  separately in T-006 (US-0006), which builds on this service.
- **Ownership / authorization** is deliberately out of scope: T-001 has no dependencies and lands
  before users (T-003) and RBAC (T-005) exist, so this service has no notion of who owns a file.
  Until then the bulk soft-delete endpoint is callable by anyone with any ids. Access rules are added
  by the consuming features later.
