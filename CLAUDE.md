# CLAUDE.md

Conventions for this repo. Read this before adding a feature.

## Repo shape

pnpm + Turborepo. Workspaces are `apps/*` and `packages/*`.

| Path | Package | Role |
| --- | --- | --- |
| `apps/api` | `api` | NestJS 11 HTTP app. |
| `apps/web`, `apps/docs` | — | Frontends. |
| `packages/service` | `@repo/service` | NestJS **providers** shared across apps. |
| `packages/database` | `@repo/db` | Prisma 7 schema, generated client, `prisma` singleton. |
| `packages/ui`, `packages/eslint-config`, `packages/typescript-config` | — | Shared frontend/tooling. |

Packages are consumed as **raw TypeScript source**, not compiled output. There is no build step
inside `packages/service` — apps bundle it.

## Where does a new service go?

This is the first decision for any backend feature.

**Used by more than one app** → `packages/service/src/<name>/`, imported as `@repo/service/<name>`.
Example: the storage service — the API, and later a worker or admin app, all upload files.

**Used by exactly one app** → keep it inside that app, e.g. `apps/api/src/users/`. Do not put it in
`packages/service` "in case someone needs it later." Move it when a second app actually needs it.

When unsure, start app-local. Promoting later is a file move; demoting is a dependency cleanup across
every consumer.

## Rules for services in `packages/service`

1. **`index.ts` is mandatory.** `packages/service/package.json` has
   `"exports": { "./*": "./src/*/index.ts" }`, so a directory only becomes importable as
   `@repo/service/<name>` once it has an `index.ts`. Never edit the `exports` field to add a service —
   the wildcard already covers it.

2. **Providers only — no `@Module`, no `@Controller`.** Modules declare `imports`/`providers`/
   `exports`, which are app-level wiring decisions (which queues, which controllers, whether this app
   runs the worker). Each app declares its own module.

3. **Ship a `nestjs-module.md`** next to the code. Because the package does not export a module, this
   file is the recipe the app copies. It must contain:
   - the full `@Module({ imports, controllers, providers, exports })` block, copy-pasteable;
   - **real import paths** — `import { StorageService } from '@repo/service/storage';`
   - prerequisites (global modules that must be imported, `forRoot` calls, required env vars);
   - which providers to export and which are internal.

   See `packages/service/src/storage/nestjs-module.md` for the reference example.

4. **Export the service, not its internals.** Repositories and adapters are exported from `index.ts`
   for wiring and tests, but the module's `exports` array lists only the service. Other features
   inject the service.

5. **Stay framework-agnostic at the boundary.** Do not accept `Express.Multer.File`, `Request`, or
   other app-framework types in a package's public API — define a structural type instead.

## Layering

```
controller (app)  →  service  →  repository  →  Prisma
                             →  adapter     →  external API / SDK
```

- **`*.repository.ts`** — talks to Prisma and nothing else. Never imports an external SDK.
- **`*.adapter.ts`** — wraps one external system (S3, Stripe, an email provider). Never imports
  Prisma. "Adapter" over "client" or "provider": `provider` already means something specific in Nest
  DI, and `client` collides with SDK class names.
- **`*.service.ts`** — the only class that knows both sides exist. Owns orchestration, id/key
  generation, and cross-store consistency (compensating deletes when a write fails halfway).
- **`*.processor.ts`** — a BullMQ `WorkerHost`. Schedules its own repeatable job in `onModuleInit`
  via `upsertJobScheduler` (idempotent across restarts and replicas).
- **`*.constants.ts`** — env constants and queue/cron names.
- **`*.types.ts` / `*.dto.ts`** — types when the shape is only compile-time; DTO classes only when
  runtime validation is actually needed (a JSON body). No DTO for a request with nothing to validate.
  A DTO carrying `class-validator` or `@ApiProperty` decorators is HTTP-shaped, so it lives in the
  **app** alongside the controller; the package method takes plain values.

Inside an app feature, HTTP-shaped classes go under `dto/`, split by direction, **one file per
endpoint** and always suffixed `.dto.ts`:

```
apps/<app>/src/<feature>/
├── <feature>.controller.ts
├── <feature>.module.ts
└── dto/
    ├── request/   # validated request bodies — class-validator + @ApiProperty
    │   └── soft-delete-files.dto.ts      -> SoftDeleteFilesDto
    └── response/  # documented response schemas — @ApiProperty, `implements` the package type
        ├── uploaded-file.dto.ts          -> UploadedFileResponse   (POST /storage)
        ├── file-metadata.dto.ts          -> FileMetadataResponse   (GET /storage/:id)
        └── soft-delete-files.dto.ts      -> SoftDeleteFilesResponse (DELETE /storage/soft)
```

Response classes are DTOs too — they are decorated transport shapes, same as request bodies, so both
sit under `dto/` and both use the `.dto.ts` suffix; the directory carries the direction, not the
filename. Name each file after the endpoint it serves rather than the feature, so one lumped
`<feature>.response.ts` never accumulates. A response class that extends another simply imports it
from its sibling file — Swagger resolves the inheritance across files unchanged. Nothing else in the
app may `@ApiProperty` a type; see the Swagger section.

Repeatable jobs use `queue.upsertJobScheduler(id, { pattern }, { name })` in `onModuleInit`, not
`queue.add(..., { repeat })`. The legacy form keys the schedule by a hash of its options, so changing
a cron pattern registers a second schedule next to the old one instead of replacing it.

## API documentation (Swagger)

- Every controller is documented: `@ApiTags` on the class, `@ApiOperation` plus a response decorator
  on each route, `@ApiParam` for path params, and `@ApiNotFoundResponse` (etc.) for the error paths a
  caller must handle.
- **Swagger stays in the app.** Never put `@ApiProperty` on a type in `packages/service` — OpenAPI is
  a transport concern, and doing so drags `@nestjs/swagger` into shared providers.
- When a package exposes a plain type and the app needs a documented schema, declare a response class
  in the app that `implements` the package type. The compiler then catches drift between the
  documented shape and the real one.
- Arrays need explicit brackets: `@ApiOkResponse({ type: [Thing] })`, or the docs claim a single
  object.
- The UI is served at `/docs`, wired in `apps/<app>/src/main.ts`.

## Environment variables

- Read them in a `<feature>.constants.ts`, exported as `string | undefined`. That file must **never
  throw on import** — a package that explodes at import time breaks every test that touches it.
- Validate in the consuming class's **constructor**, throwing one error that names *all* missing
  variables. This fails app boot loudly instead of failing on the first request.
- Constants are evaluated at import time, so `import 'dotenv/config'` must be the **first** import in
  `apps/<app>/src/main.ts`, before anything that reads `process.env`.
- Add every new variable to `globalEnv` in the root `turbo.json`, and to the app's `.env.example`.

## Database

- Schema files live in `packages/database/prisma/schema/*.prisma`, one per domain. Files under
  `prisma/drafts/` are not active.
- Field names are **snake_case in the Prisma client too** (`mime_type`, `created_at`) — only tables
  are remapped via `@@map`.
- Access Prisma through `PrismaService` from `@repo/service/prisma`, not by importing `prisma`
  directly. `PrismaModule` is `@Global()`; the handle is `this.prisma.client`.
- Soft delete convention: a nullable `deleted_at`. Read paths filter `deleted_at: null`, and a
  soft-deleted row reads as **not found**. Guard re-deletes with `deleted_at: null` in the `where` so
  the original timestamp is never overwritten.
- After changing a schema: `pnpm --filter @repo/db run db:migrate -- --name <name>` then
  `db:generate`.

## Testing

- **Every service gets unit tests**, in the package or the app — no exceptions.
- Specs live in a `test/` tree that **mirrors `src/`**, not beside the code — `src/` stays readable
  when a feature has as many spec files as source files:

  ```
  packages/service/
  ├── src/storage/storage.service.ts
  └── test/storage/storage.service.spec.ts
  ```

  Jest `rootDir` is the package root, and `testRegex` still matches `*.spec.ts` **anywhere** — a spec
  accidentally left under `src/` runs and fails loudly rather than being silently skipped. Coverage
  is collected from `src/` only.
- Unit tests mock everything external: no real database, no real Redis, no real third-party API.
- Add integration tests when the value is in the wiring rather than the logic — multi-step flows
  across stores, or a compensating-delete path. Keep them separate from unit tests.
- A new package needs a `"test": "jest"` script; Jest config already lives in its `package.json`.

## Commands

```sh
docker compose -f ./compose/dev.yml up -d   # Postgres :5432, Redis :6379
pnpm install
pnpm dlx turbo run dev
pnpm dlx turbo run lint check-types
pnpm --filter <package> test
```

## Docs

- `docs/roadmap.md` is the task board; `docs/user-stories/NNNN-*.md` hold the detail. Task and story
  ids are append-only.
- Finishing a task means updating both: flip the roadmap status and tick the story's acceptance
  criteria.

## Commits

Conventional Commits, scoped: `feat(storage): ...`, `chore(deps): ...`, `chore(docs): ...`.
