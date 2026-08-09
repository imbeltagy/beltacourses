# US-0007 — Course Authoring

- **Phase:** Phase 1 — MVP
- **Tasks:** T-007
- **Status:** Pending

## Story

As a teacher, I want to create a course with modules and lectures, so that I can structure the
content I sell.

## Details

**Course**

- Required: title, description, thumbnail, price.
- Optional: intro video.
- Optional: introduction — long markdown that can embed images and links.
- A new course starts as `draft` — it is invisible to students and cannot be purchased until it is
  published (US-0008).

**Module**

- Belongs to a course, ordered.
- Only a title and a description — no content of its own.
- Holds the lectures.

**Lecture**

- Belongs to a module (and to the course), ordered.
- Title, description, and content — long markdown that can embed images and links.
- Optional video, rendered **on top of** the lecture content.
- Can be flagged as a free demo lecture.

## Acceptance criteria

- [ ] A newly created course has the status `draft`.
- [ ] A course stores title, description, thumbnail, price, and optionally an intro video and a
      markdown introduction.
- [ ] A module stores only title, description and its order within the course.
- [ ] A lecture stores title, description, markdown content, its order, and optionally a video.
- [ ] Markdown fields (course introduction, lecture content) render embedded images and links, and
      uploaded images are served through the file service (US-0001).
- [ ] A teacher can create/update/delete a draft course.
- [ ] Modules and lectures can be added, reordered and removed.
- [ ] A lecture can reference an uploaded video (US-0006).
- [ ] Only the owning teacher (or an authorized admin) can edit the course.

## Notes

_None._
