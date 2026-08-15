# US-0006 — Video Upload Service

- **Phase:** Phase 1 — MVP
- **Tasks:** T-006
- **Status:** Pending

## Story

_TBD_

## Details

_TBD_

## Acceptance criteria

- [ ] _TBD_

## Notes

**Inherited constraint from [US-0001](./0001-file-upload-service.md) — must be resolved here.**

T-001 deliberately builds **stable public S3 URLs** and stores them in the `File.url` column, because
everything it serves in Phase 1 is public (profile pictures, banners, course covers). Lecture video is
the first genuinely private asset, so private access is this task's problem:

- A permanent public URL for paid content leaks forever the moment one buyer shares the link. Course
  material must not be reachable by URL alone.
- The fix is time-limited presigned URLs (`@aws-sdk/s3-request-presigner`) generated per request
  instead of a stored `url`, which means revisiting the `File` model.
- It also needs bucket-policy work to be enforceable: S3 Block Public Access is on by default, so a
  bucket holding both public and private objects needs a `public/` prefix policy or per-object ACLs.

**This must land before any paid content can be uploaded** (T-007 course authoring, T-011 purchase).

The old project (`courses/backend/src/storage`) already implemented multipart/resumable upload for
video — `initVideoUpload` / `uploadVideoPart` / `abortVideoUpload`, backed by `MultiPartUpload` and
`UploadedPart` models, with a worker that aborts uploads idle for more than 2 hours. It is worth
reading before designing this one; it was deliberately left out of T-001's scope.
