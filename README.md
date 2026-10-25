# Turborepo Project

## Documentation

- [`docs/roadmap.md`](./docs/roadmap.md) — task board and status.
- [`docs/user-stories/`](./docs/user-stories/) — the business rules behind each task: what the platform
  does and why, with no technical choices.
- [`docs/technical-design/`](./docs/technical-design/) — how each story is built: data models, queues,
  tokens, trade-offs.
- [`docs/file-structure.md`](./docs/file-structure.md) — where code goes, for both halves of the repo,
  plus the Tailwind `@source` trap that fails with no error message.

## Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Install packages

```sh
pnpm install
```

This will automatically trigger this command after finish:

```
pnpm dlx turbo run db:generate
```

`@repo/db` (like `@repo/backend` and the `@repo/frontend*` packages) is consumed as raw TypeScript
source, not a compiled package — apps bundle it themselves. `db:generate`
still has to run first though: it's Prisma codegen (into the gitignored
`packages/database/generated/`), not a package build, and both `@repo/db`'s
source and anything importing it need that generated client to exist.

## Run for development

Start the database:

```sh
docker compose up -d
```

Start the apps:

```sh
pnpm dlx turbo run dev
```

### Ports

`turbo run dev` starts everything at once, so each process has its own port.

| Port     | What                                         |
| -------- | -------------------------------------------- |
| **3000** | `apps/api` — NestJS. `PORT` overrides it.    |
| **3001** | `apps/client` — the public Next.js frontend. |
| **3002** | `apps/admin` — the staff control panel.      |
| **3003** | Prisma Studio (`@repo/db`'s `dev` script).   |

Both frontends read the API's location from `NEXT_PUBLIC_API_BASE_URL`; each has
a `.env.example` to copy.

### API URLs

| URL                                | What it is                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| http://localhost:3000/health-check | Liveness check.                                                                          |
| http://localhost:3000/docs         | Swagger UI — every endpoint, with a request runner.                                      |
| http://localhost:3000/queues       | BullBoard — BullMQ queue monitor: scheduled jobs, run history, logs, and manual re-runs. |

`/docs` and `/queues` are **unauthenticated**. Gate both before exposing the API
outside local development — BullBoard can trigger and remove jobs.

## Database commands

Migrate the database after updating the Prisma schema:

```sh
pnpm dlx turbo run db:migrate
```

Deploy migrations to the database:

```sh
pnpm dlx turbo run db:deploy
```

Generate after updating Prisma models:

```sh
pnpm dlx turbo run db:generate
```

Reset the database and seed data:

```sh
pnpm dlx turbo run db:seed
```

Live preview the database:

```sh
pnpm dlx turbo run db:preview
```

## Adding a new frontend app

Frontend apps are **routers**. `apps/client` and `apps/admin` are both a root
layout plus route files that re-export a page:

```tsx
// apps/<name>/src/app/users/page.tsx
export { default } from "@repo/frontend-features/pages/admin/users";
```

Copy `apps/admin` as the template, then:

1. Rename it in `package.json` and pick a free port for `dev`/`start`
   (see [Ports](#ports)).
2. Keep `transpilePackages: ["@repo/frontend", "@repo/frontend-features"]` in
   `next.config.ts` — both packages ship raw TypeScript.
3. Keep `src/app/globals.css` as-is. It imports `@repo/frontend/styles/theme.css`,
   which declares the `@source` roots for both packages. **Without those,
   Tailwind silently emits no CSS for any class used only inside a package** —
   no error, just unstyled elements.
4. Copy `.env.example` to `.env` and set `NEXT_PUBLIC_API_BASE_URL`.
5. Put pages in `@repo/frontend-features`, not in the app. Only what genuinely
   cannot leave the app stays: `middleware.ts`, route handlers, `not-found.tsx`,
   the root layout, and route-group layouts that guard access.

Note that `public/assets` is currently duplicated per app — see the static-files
item on the backlog.

## Adding a new NestJS app

NestJS apps (like `apps/api`) run through webpack so they can import
`@repo/*` workspace packages as raw source with no build step, live-reloading
on every edit — the same relationship `apps/client` has with `@repo/frontend`
via Next.js's own bundler. `apps/api` is the template; a plain `nest new` app
doesn't have this wired up by default.

1. Scaffold it: `npm i -g @nestjs/cli`, then from the repo root
   `nest new apps/<name>`.
2. Copy `apps/api/nest-cli.json`'s `compilerOptions` (`webpack: true`,
   `webpackConfigPath: "webpack.config.js"`) and `apps/api/webpack.config.js`
   verbatim — the `webpack-node-externals` allowlist (`/^@repo\//`) bundles
   any workspace package the app imports, present or future, so it never
   needs editing per-package.
3. Add `webpack-node-externals` to `devDependencies` (`webpack.config.js`
   requires it directly).
4. If the app imports `@repo/db` transitively (e.g. via `@repo/backend`),
   TypeScript's `nodenext` module resolution (the repo default) will fail on
   Prisma's generated client, which uses extensionless relative imports.
   Fix by overriding `module`/`moduleResolution` to `esnext`/`bundler` in the
   app's `tsconfig.build.json` only (see `apps/api/tsconfig.build.json`) —
   scoped there so Jest/`ts-jest`, which uses the plain `tsconfig.json`, is
   unaffected.
5. Add the workspace packages you need as normal `workspace:*` dependencies.

## Adding a new NestJS package

Backend packages (like `packages/backend`) are libraries, not apps — no
`main.ts`/bootstrap, imported as raw source by whichever app bundles them.

1. Scaffold it: `nest new packages/<name>`.
2. Rename it in `package.json` to `@repo/<name>`.
3. Delete `src/main.ts` and the `test/` e2e scaffolding — those are for a
   runnable app, not a library.
4. Set `exports` to the source pattern used by `@repo/backend`, matching
   whatever subpath layout you want callers to use (directory-per-feature
   with an `index.ts` barrel, e.g. `@repo/<name>/health-check`):
   ```json
   "exports": { "./*": "./src/*/index.ts" }
   ```
5. Remove any `build`/`dev` (`tsc`) scripts and `tsconfig.build.json` — no
   consumer builds this package standalone, the consuming app's webpack
   bundles the source directly.
6. Nothing to do on the consumer side: any app following the "Adding a new
   NestJS app" webpack setup above already allowlists all `@repo/*` packages
   for bundling.
