# Video upload and fetching

- **Implements:** `007-video-upload`, `014-progress-tracking` (access gate)
- **Status:** Proposed — nothing is built yet
- **Builds on:** [05-file-upload.md](./05-file-upload.md)
- **Blocks:** course authoring and purchase. No paid content may be uploaded before this lands.

## Problem

The file service stores a permanent public `url`. For a paid lecture that leaks forever the moment one
buyer shares the link, and a single-request upload cannot carry a large video reliably.

## 1. Public vs private objects

- Bucket keys are split by prefix: `public/…` (avatars, banners, covers, lecture images) and
  `private/…` (lecture video). A bucket policy makes only `public/*` readable; S3 Block Public Access
  stays on for everything else.
- `File` gains a `visibility` (`public` | `private`). **`url` is stored only for public files**; private
  files have none, so nothing can serve them by accident.
- Visibility is decided at upload, from the endpoint used, not from client input.

## 2. Upload (multipart, resumable)

Video bypasses the API for the bytes: the API only brokers the S3 multipart protocol.

1. `init` — creates the metadata row (`status: uploading`) plus an S3 multipart upload; returns file id.
2. `part` — returns a presigned `UploadPart` URL for part N; the client PUTs the bytes straight to S3
   and reports the part's ETag. Parts are recorded in an `UploadedPart` table so a client can resume.
3. `complete` — completes the S3 upload with the recorded parts, flips the row to `ready`.
4. `abort` — aborts the S3 upload and removes the row.

Data model: `MultiPartUpload` (file id, S3 upload id, last activity) and `UploadedPart` (upload id,
part number, ETag), as in the previous backend.

**Idle cleanup:** a BullMQ worker, scheduled with `upsertJobScheduler`, aborts uploads idle for more than
**2 hours** and deletes their rows. Idempotent in the same way as the file cleanup worker.

## 3. Fetching (private playback)

A lecture holds a file id, never a URL. The URL is produced per request:

```
GET /lectures/:id/video  →  access check  →  presigned GET URL (short TTL)
```

Access check, in order:

1. Demo lecture → allowed for anyone.
2. Otherwise the student must own the course (owned list) — closed courses included.
3. The lecture must be unlocked for that student (progress sequence).
4. Owning teacher / authorized admin may always fetch.

A locked lecture serves neither video nor content (business story 014).

- TTL: minutes, long enough to start playback; the player re-requests on expiry. Exact value is a
  config, not a constant.
- The presigned URL is the capability: it is not logged and not cached by the API.
- Streaming goes direct from S3 (range requests) — the API never proxies video bytes.

## Proposed: HLS streaming (to check later)

Not decided. Replaces the presigned-MP4 delivery in section 3 if adopted.

- **No full download.** HLS splits a video into 4-6 second segments, so playback starts after a few,
  seeking fetches only the target, and quality switches per segment.
- **Flow:** multipart upload → S3 original → conversion → S3 HLS output → CloudFront → player. The bucket
  is private, readable only by CloudFront. After the section 3 access check, the API issues short-lived
  **signed cookies** (not URLs: HLS is hundreds of requests). The video is `processing` until `ready`.
- **Conversion:** H.264 + AAC, 360p to 1080p. Keep the original privately for re-encoding.
- **Who converts and delivers:** AWS MediaConvert + CloudFront (leaning), an FFmpeg worker, or a managed
  service (Cloudflare Stream, Mux, Bunny). Cloudflare in front of S3 is a poor fit. Decide on hours of
  video in year one and who runs the pipeline.
- **Protection:** private bucket and signed cookies from the start. Later: watermark, AES-128 HLS. DRM is
  skipped at this size. Screen recording cannot be stopped.

## Proposed: live sessions (to check later)

Not decided. Serves stories 025 and 026. Live video is bought from a provider, not built.

- **Two modes, chosen by the teacher and priced differently:** interactive (WebRTC, students can speak;
  LiveKit) costs more, broadcast (RTMP in, HLS out; Amazon IVS) costs less. One internal interface hides
  the mode; the price per mode is configuration (stories 019, 023).
- **Flow:** "Start" creates a room or stream and gives the teacher a publish token. A booked student gets
  a short-lived view token. The provider records to S3, an idempotent webhook marks the session finished,
  and the recording goes through the same conversion into its lecture. Missed sessions play like any
  recorded lecture.
- **Failures:** teacher disconnect (allow rejoin), recording never arrives (mark `recording_missing`,
  alert), viewer cap, expiring tokens.

## Open questions

- Maximum video size and allowed mime types.
- Whether `ready` waits on a virus/format check.
- Whether to launch with one live mode or both.
