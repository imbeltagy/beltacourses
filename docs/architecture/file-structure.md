# File Structure

Where code goes and why. This is the map; `CLAUDE.md` is the rulebook — it states the conventions in
imperative form for anyone (or anything) writing code, and links here rather than redrawing the tree.

If you are adding a feature and only want the one-line answer, skip to
[Where does X go?](#where-does-x-go).

## The workspace

pnpm + Turborepo. Three workspace globs: `apps/*`, `packages/*`, `packages/frontend/*` — the third
exists so the frontend packages can sit together one level down.

```
apps/
├── api/                  NestJS 11 HTTP app          :3000
├── client/               Next.js 16 public frontend  :3001
└── admin/                Next.js 16 staff panel      :3002
packages/
├── backend/              @repo/backend               shared NestJS providers
├── database/             @repo/db                    Prisma schema + client
├── frontend/
│   ├── common/           @repo/frontend              design system + non-React utils
│   └── features/         @repo/frontend-features     pages, actions, API types
├── eslint-config/
└── typescript-config/
```

Every `@repo/*` package is consumed as **raw TypeScript source**. None of them has a build step. The
API bundles its packages with webpack; the Next apps bundle theirs via `transpilePackages`. The one
thing that must run before anything compiles is `db:generate` (Prisma codegen), which `pnpm install`
triggers for you.

### Export patterns

Each package exposes itself through a wildcard, so adding a directory is enough to make it
importable. **Never edit an `exports` field to add a feature** — if the import does not resolve, the
barrel file is missing, not the map.

| Package | `exports` | So `X` resolves to |
| --- | --- | --- |
| `@repo/backend` | `"./*": "./src/*/index.ts"` | `@repo/backend/core` → `src/core/index.ts` |
| `@repo/frontend` | `"./*": "./src/*/index.tsx"` | `@repo/frontend/components/logo` → `src/components/logo/index.tsx` |
| `@repo/frontend-features` | `"./*": "./src/*/index.tsx"` | `@repo/frontend-features/pages/auth/login` → `src/pages/auth/login/index.tsx` |
| `@repo/db` | `".": "./src/index.ts"` | one entry point, no subpaths |

Exact keys beat the wildcard, and exist only where a barrel is `.ts` rather than `.tsx`, or is not a
module at all:

- `@repo/frontend`: `./ui`, `./utils/api-client`, `./utils/cookies`, `./styles/theme.css`
- `@repo/frontend-features`: `./actions/*`, `./types/*`, `./configs/*` — these are flat files
  (`src/actions/auth-actions.ts`), not directories with barrels.

A consequence worth knowing: a directory with no `index.tsx` and no exact key is **private to its
package**. `src/hooks/use-query-state.ts` in features is internal for exactly this reason, as are
every page's `components/` and `hooks/` subdirectories.

---

# Backend

## An app feature

`apps/api/src/<feature>/`. The storage feature uses every piece, so it is the fullest example:

```
apps/api/src/storage/
├── storage.controller.ts      HTTP surface. Swagger lives here.
├── storage.module.ts          this app's wiring: imports, providers, exports
├── storage.service.ts         orchestration — the only class that knows both sides exist
├── storage.repository.ts      Prisma, and nothing else
├── s3.adapter.ts              one external system, and nothing else
├── storage.processor.ts       BullMQ WorkerHost
├── storage.constants.ts       env reads, queue and cron names
├── s3.constants.ts
├── storage.types.ts           compile-time shapes
└── dto/
    ├── request/               validated bodies — class-validator + @ApiProperty
    │   └── soft-delete-files.dto.ts
    └── response/              documented schemas — @ApiProperty, `implements` the package type
        ├── uploaded-file.dto.ts        POST   /storage
        ├── file-metadata.dto.ts        GET    /storage/:id
        └── soft-delete-files.dto.ts    DELETE /storage/soft
```

### Layering

```
controller  →  service  →  repository  →  Prisma
                       →  adapter     →  external API / SDK
```

The names are load-bearing:

- **`*.repository.ts`** talks to Prisma and never imports an external SDK.
- **`*.adapter.ts`** wraps one external system and never imports Prisma. "Adapter" rather than
  "client" or "provider": `provider` already means something specific in Nest DI, and `client`
  collides with SDK class names.
- **`*.service.ts`** is the only class that knows both exist. It owns orchestration, id and key
  generation, and cross-store consistency — the compensating delete when a write fails halfway is
  service work, by definition.
- **`*.processor.ts`** is a BullMQ `WorkerHost` that schedules its own repeatable job in
  `onModuleInit` via `upsertJobScheduler`, which is idempotent across restarts and replicas. Not
  `queue.add(..., { repeat })`: that keys the schedule by a hash of its options, so editing a cron
  pattern registers a second schedule beside the old one instead of replacing it.

### DTOs

Under `dto/`, split by direction, **one file per endpoint**, always suffixed `.dto.ts`. The directory
carries the direction, so the filename does not — name each file after the endpoint it serves, and a
lumped `<feature>.response.ts` never accumulates.

Response classes are DTOs too: decorated transport shapes, same as request bodies. A response class
that extends another just imports it from its sibling file; Swagger resolves the inheritance across
files unchanged.

Write a DTO **class** only when something needs runtime validation or documentation. If the shape is
compile-time only, it is a type in `*.types.ts`. A request with nothing to validate gets no DTO at
all.

### Where Swagger lives

In the app, always. `@ApiProperty` never appears in `packages/backend` — OpenAPI is a transport
concern, and putting it there would drag `@nestjs/swagger` into shared providers.

When a package exposes a plain type and the app needs a documented schema, the app declares a
response class that `implements` the package type. The compiler then catches drift between the
documented shape and the real one, which is the whole point of the arrangement.

Arrays need explicit brackets — `@ApiOkResponse({ type: [Thing] })` — or the docs claim a single
object. The UI is served at `/docs`, wired in `apps/<app>/src/main.ts`.

## `packages/backend` (`@repo/backend`)

Providers shared across backend apps. Three subpaths today:

```
packages/backend/src/
├── core/        auth primitives: password, token, session, permissions,
│                guards and decorators.  @repo/backend/core
├── prisma/      PrismaService — the one Prisma handle.  @repo/backend/prisma
└── redis/       RedisService — the one Redis connection. @repo/backend/redis
```

**Providers only — no `@Module`, no `@Controller`.** Modules declare `imports`/`providers`/`exports`,
which are app-level wiring decisions (which queues run, which controllers mount, whether this app
runs the worker), so each app declares its own.

`prisma` and `redis` are the two deliberate exceptions: a single connection must be shared
process-wide, so both ship a `@Global()` module that `AppModule` imports once. That is what lets
`SessionService` in `core` reach Redis with no module edge to wire. Each has a `nestjs-module.md`
beside it recording the call.

`index.ts` exports repositories and adapters too, for wiring and tests — but a module's `exports`
array should list only the service. Other features inject the service, not its internals.

**Stay framework-agnostic at the boundary.** No `Express.Multer.File`, no `Request` in a public
signature; define a structural type instead. See [`packages/backend/README.md`](../../packages/backend/README.md).

### Which side does a new service go on?

Used by more than one app → `packages/backend/src/<name>/`. Used by exactly one → keep it in that
app, e.g. `apps/api/src/users/`.

When unsure, start app-local. Promoting later is a file move; demoting is a dependency cleanup across
every consumer.

## `packages/database` (`@repo/db`)

```
packages/database/prisma/
├── schema/          *.prisma, one file per domain — the active schema
├── migrations/
├── seed/            index.ts + one <name>.seed.ts per concern
└── drafts/          NOT active, not imported by anything
```

Field names are **snake_case in the generated client too** (`mime_type`, `created_at`); only tables
are remapped, via `@@map`.

Reach Prisma through `PrismaService` from `@repo/backend/prisma` — the handle is `this.prisma.client`
— rather than importing the `prisma` singleton directly.

Soft delete is a nullable `deleted_at`. Read paths filter `deleted_at: null`, and a soft-deleted row
reads as **not found**. Guard re-deletes with `deleted_at: null` in the `where`, so the original
timestamp is never overwritten.

After a schema change: `pnpm --filter @repo/db run db:migrate -- --name <name>`, then `db:generate`.

## Tests

Specs live in a `test/` tree that **mirrors `src/`**, never beside the code, so `src/` stays readable
when a feature has as many spec files as source files:

```
packages/backend/
├── src/core/session.service.ts
└── test/core/session.service.spec.ts
```

Jest's `rootDir` is the package root and `testRegex` matches `*.spec.ts` **anywhere** — so a spec
accidentally left under `src/` runs and fails loudly rather than being silently skipped. Coverage is
collected from `src/` only.

Every service gets unit tests, and they mock everything external: no real database, no real Redis, no
real third-party API. Integration tests go in `apps/api/test/integration/` with their own Jest config,
and are for the cases where the value is in the wiring rather than the logic — a multi-step flow
across stores, or a compensating-delete path.

---

# Frontend

## Apps are routers

`apps/client` and `apps/admin` contain almost no code. A route file re-exports a page:

```tsx
// apps/admin/src/app/(dashboard)/users/page.tsx
export { default } from "@repo/frontend-features/pages/admin/users";
```

```
apps/admin/src/app/
├── layout.tsx                 root: fonts, theme, globals.css
├── globals.css
├── (auth)/
│   ├── layout.tsx             guest-only guard + AuthLayout
│   └── login/page.tsx         → pages/admin/login
└── (dashboard)/
    ├── layout.tsx             auth guard + DashboardLayout
    ├── page.tsx               → pages/admin/home
    ├── users/page.tsx         → pages/admin/users
    └── groups/page.tsx        → pages/admin/groups
```

Only what genuinely cannot leave the app stays in it: `middleware.ts`, route handlers,
`not-found.tsx`, `globals.css`, the root layout, and route-group layouts that guard access. Because
of this, `apps/admin` mounts the same pages `apps/client` could, and a page can move between URLs
without its code moving.

## `@repo/frontend` vs `@repo/frontend-features`

The test is: **would a second app reuse this unchanged?** A `Button`, yes. The login page, no.

```
packages/frontend/common/src/           @repo/frontend
├── ui/<name>.tsx        shadcn primitives, flat files, barrelled by index.ts → @repo/frontend/ui
├── components/          composite components (form/, logo, container)
├── theme/app-theme/     theme provider + toaster
├── fonts/
├── styles/theme.css     design tokens — and the @source roots (see below)
└── utils/
    ├── index.tsx        cn()
    ├── api-client/      ApiClient, `api` / `apiGuest`  → @repo/frontend/utils/api-client
    └── cookies/         "use server" cookie accessors  → @repo/frontend/utils/cookies
```

`src/utils` is the non-React half — no JSX. It sits under `utils/` rather than in a separate package
because splitting it out bought nothing but a second manifest, tsconfig, and `transpilePackages`
entry.

```
packages/frontend/features/src/         @repo/frontend-features
├── pages/<area>/<page>/  the page triad — see below
├── layout/<name>/        auth-layout, dashboard-layout
├── components/<name>/    shared across pages (page-wrapper, table-search, table-pagination)
├── actions/              "use server" entry points, one file per API area
├── types/
│   ├── action.ts         ActionResult / DataResult
│   └── api/              wire shapes mirroring the API's DTOs
├── configs/endpoints.ts  every API URL, and the only place the base URL is interpolated
└── hooks/                cross-page hooks (internal — no barrel, so not importable outside)
```

## The page triad

A page directory splits three ways so each part changes for one reason:

```
pages/admin/login/
├── index.tsx                          server component: the static half
├── components/
│   └── moderator-login-form.tsx       "use client": markup and interaction
└── hooks/
    └── use-moderator-login-form.ts    schema, form instance, submit handler
```

- **`index.tsx`** stays a server component and holds what does not need hydration — headings, copy,
  and (for a list page) the fetch itself.
- **`components/`** reads state from a hook and renders it. It contains no schema and no API call, so
  wiring a form to a different action does not touch it.
- **`hooks/`** owns the form schema, the `useForm` instance and the submit handler.

A page uses only the parts it needs. `pages/admin/users/` has `components/` but no `hooks/`, because
its state lives in the URL and the server component reads it directly — there is nothing left for a
hook to own.

Only `index.tsx` is reachable from outside the package; `components/` and `hooks/` are private by
virtue of the export pattern.

## Actions, types, and list state

Server actions are grouped by **API area** (`auth-actions.ts`, `users-actions.ts`,
`groups-actions.ts`), not by page, because two pages often hit the same endpoint. They call
`@repo/frontend/utils/api-client` and return a discriminated result, so a caller branches on
`success` rather than catching. Actions never throw and never leak a status code to the UI.

Success copy belongs to the action, not to the API response. The auth endpoints return no `message`
field, and passing the api-client's fallback straight through once put the literal string `"success"`
in a toast.

`types/api/` mirrors the API's wire shapes by hand — dates are ISO strings there, not `Date`. They
are hand-written rather than generated from the OpenAPI schema for now; if that becomes a drift
problem, the generator is the fix, not looser types.

**List state lives in the URL.** Page, search and filters are read from `searchParams`, which is what
keeps a list page a server component: it reads, fetches and renders, while only the controls are
client components. It also makes a filtered list shareable and survivable across a refresh. The
`useQueryState` hook centralises the URL writes, and resets `page` whenever a filter changes — page 4
of an unfiltered list is rarely a valid page of the filtered one.

---

# Tailwind: the one failure with no diagnostic

**Tailwind does not scan `node_modules`, and both frontend packages reach an app through a workspace
symlink.** Without an `@source` directive naming them, every class used *only* inside a package
produces no CSS.

There is no error. No warning. The build succeeds, `check-types` and `lint` pass, and the page renders
with the classes present in the HTML and absent from the stylesheet. It looks like a layout bug, not
a build bug.

It has already cost this repo once. After the pages moved into `@repo/frontend-features`, about 10 KB
of CSS silently stopped being emitted for **both** apps — measured as 51,470 bytes without the
directive against 61,948 with it. It was caught only because a layout test measured a sidebar at
640px instead of 250px.

## Where the fix lives

In [`packages/frontend/common/src/styles/theme.css`](../../packages/frontend/common/src/styles/theme.css),
not in any app:

```css
@source "../";
@source "../../../features/src";
```

Every app already imports that file for the design tokens, so every app — including one added
tomorrow — gets the scan roots for free. An app's `globals.css` is therefore three imports and should
stay that way:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@repo/frontend/styles/theme.css";
```

Paths in `@source` resolve relative to **the file containing them**, which is why they look like they
point upward out of the package.

## How to verify it

Because the failure is invisible, check the artefact rather than the page. Pick a class used only
inside a package, build, and grep the emitted CSS:

```sh
# 1. Confirm the class really is package-only.
grep -rl "aspect-5/4" packages/frontend/common/src    # expect: no match
grep -rl "aspect-5/4" packages/frontend/features/src  # expect: a match

# 2. Clean production build.
rm -rf apps/admin/.next && pnpm --filter admin build

# 3. The rule must be in the output.
grep -c "aspect-ratio:5/4" $(find apps/admin/.next/static -name "*.css")   # expect: 1, not 0
```

Do this after anything that moves code between packages, adds a frontend package, or creates a new
app. Comparing total CSS size before and after is a useful smoke signal too — a sudden ~10 KB drop is
the symptom.

## Related sharp edges

The shadcn CLI needs handling in this layout — it rewrites `cn` to an unrelated npm package of that
name, and needs a `paths` block in the package tsconfig that nothing else uses. Both are documented
in [`packages/frontend/common/README.md`](../../packages/frontend/common/README.md); follow that when
adding a primitive.

---

# Where does X go?

| You are adding | It goes in |
| --- | --- |
| An HTTP endpoint | `apps/api/src/<feature>/<feature>.controller.ts` |
| Business logic used by one app | `apps/api/src/<feature>/<feature>.service.ts` |
| Business logic used by two apps | `packages/backend/src/<name>/` (+ `index.ts`) |
| A Prisma query | `<feature>.repository.ts` — never in a service or controller |
| A third-party SDK call | `<feature>.adapter.ts` — never alongside Prisma |
| A validated request body | `apps/api/src/<feature>/dto/request/<endpoint>.dto.ts` |
| A documented response | `apps/api/src/<feature>/dto/response/<endpoint>.dto.ts` |
| A compile-time-only shape | `<feature>.types.ts` |
| A database model | `packages/database/prisma/schema/<domain>.prisma` |
| A scheduled job | `<feature>.processor.ts`, scheduled in `onModuleInit` |
| A page | `packages/frontend/features/src/pages/<area>/<page>/` |
| A route for that page | `apps/<app>/src/app/.../page.tsx`, one re-export line |
| A server action | `packages/frontend/features/src/actions/<area>-actions.ts` |
| An API wire type | `packages/frontend/features/src/types/api/<area>.ts` |
| An API URL | `packages/frontend/features/src/configs/endpoints.ts` |
| A shadcn primitive | `packages/frontend/common/src/ui/` + a line in `ui/index.ts` |
| A reusable component | `packages/frontend/common/src/components/<name>/index.tsx` |
| A component used by pages only | `packages/frontend/features/src/components/<name>/index.tsx` |
| A page shell | `packages/frontend/features/src/layout/<name>/index.tsx` |
| An env var | the app's `.env.example` **and** `globalEnv` in `turbo.json` |
| A unit test | `<package-or-app>/test/`, mirroring the path under `src/` |
