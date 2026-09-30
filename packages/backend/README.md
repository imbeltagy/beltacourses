# @repo/backend

NestJS **providers** shared across backend apps. Consumed as raw TypeScript
source — there is no build step here; the importing app's webpack bundles it
(see "Adding a new NestJS app" in the root README for the allowlist that makes
that work).

Named to pair with `@repo/frontend` and `@repo/frontend-features`, so the two
halves of the repo read symmetrically. It was `@repo/service` until the rename.

## What's in it

| Subpath                 | What                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `@repo/backend/core`    | Auth primitives: password hashing, JWT issue/verify, moderator sessions, the permission catalog, and the guards + decorators that enforce them. |
| `@repo/backend/prisma`  | `PrismaService` — the one Prisma handle, exposed as `this.prisma.client`.     |
| `@repo/backend/redis`   | `RedisService` — the one Redis connection, exposed as `this.redis.client`.    |

## The export pattern

`package.json` has `"exports": { "./*": "./src/*/index.ts" }`, so a directory
becomes importable as `@repo/backend/<name>` the moment it has an `index.ts`.
**Never edit the `exports` field to add one** — the wildcard already covers it.

## Providers, not modules

A service here ships providers only. Modules declare `imports`/`providers`/
`exports`, which are app-level wiring decisions — which queues run, which
controllers mount, whether this app runs the worker — so each app declares its
own.

**Two deliberate exceptions**, `prisma` and `redis`: a single connection has to
be shared process-wide, so both ship a `@Global()` module that `AppModule`
imports once. That is what lets `SessionService` in `core` reach Redis with no
module edge to wire. Each has a `nestjs-module.md` next to it explaining the
call.

`index.ts` exports repositories and adapters too, for wiring and tests — but a
module's `exports` array should list only the service. Other features inject the
service, not its internals.

## Boundaries

- **Framework-agnostic at the edge.** No `Express.Multer.File`, no `Request` in
  a public signature — define a structural type instead.
- **No Swagger.** `@ApiProperty` never appears here; OpenAPI is a transport
  concern and would drag `@nestjs/swagger` into shared providers. An app that
  needs a documented schema declares a response class that `implements` the
  plain type exported from here, so the compiler catches drift.
- **Constants never throw on import.** `<feature>.constants.ts` exports
  `string | undefined`; the consuming class validates in its constructor and
  throws once, naming every missing variable.

See the root `CLAUDE.md` for the full layering rules (`controller → service →
repository → Prisma`, `service → adapter → external SDK`) and for where a new
service belongs.

## Testing

```sh
pnpm --filter @repo/backend test
```

Specs live in `test/`, mirroring `src/`. `rootDir` is the package root and
`testRegex` matches `*.spec.ts` anywhere, so a spec accidentally left under
`src/` still runs rather than being silently skipped. Coverage is collected from
`src/` only.
