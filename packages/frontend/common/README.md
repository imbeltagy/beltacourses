# @repo/frontend

Shared shadcn/ui primitives, theme, fonts, form components and browser/server
utilities used by every frontend app in this repo (`apps/client`, and future
frontend apps).

This package holds only things **more than one app could reuse**. Anything that
belongs to a single product surface — pages, server actions, API types, page
layouts — lives in [`@repo/frontend-features`](../features/README.md) instead.

## Adding a new shadcn component

Run the shadcn CLI from **this package's directory** so it reads `components.json`
here and writes into `src/ui`:

```sh
cd packages/frontend/common
pnpm dlx shadcn@latest add <component>
```

The CLI writes a flat `src/ui/<name>.tsx` file, same as any shadcn project — add
one line for it to `src/ui/index.ts`: `export * from "./<name>.tsx";`.

Two things it gets wrong here, both of which need fixing by hand afterwards:

- **It rewrites `cn` to an npm package.** It resolves the `utils` alias in
  `components.json` to a real (unrelated) package called `cn` on npm, writes
  `import { cn } from "cn"`, and adds it to `dependencies`. Change the import to
  `from "../utils"` to match every other file here, and drop the dependency.
- **It needs the aliases to resolve.** The `paths` block in `tsconfig.json`
  exists only for the CLI — nothing in `src` imports through those aliases,
  because a path alias inside a package does not survive into the consuming
  app's bundler. Do not start using them in source.

## Layout

- `src/ui/<name>.tsx` — shadcn primitives (`button`, `card`, `input`, ...), flat
  files exactly as the CLI generates them, all re-exported from `src/ui/index.ts`
  and imported as `@repo/frontend/ui`.
- Everything else is a directory `<path>/<name>/index.tsx`, reachable through one
  export pattern (`"./*": "./src/*/index.tsx"`), so `@repo/frontend/<path>/<name>`
  resolves to `src/<path>/<name>/index.tsx`:
  - `src/components/<path>` — shared composite components (form helpers under
    `form/`, `logo`, `container`), imported as `@repo/frontend/components/<path>`.
  - `src/fonts` — shared Geist font setup, imported as `@repo/frontend/fonts`.
  - `src/theme/<name>` — `app-theme` (theme provider + toaster), imported as
    `@repo/frontend/theme/<name>`.
  - `src/utils` — the `cn()` helper, imported as `@repo/frontend/utils`.

## `src/utils` — the non-React half

Framework-agnostic helpers with no JSX. They sit under `utils/` rather than in a
second package because splitting them out bought nothing but a second manifest,
a second tsconfig and a second entry in every consumer's `transpilePackages`.

- `src/utils/api-client` → `@repo/frontend/utils/api-client`. Exports the
  static-only `ApiClient` class: `ApiClient.get/post/put/patch/delete`. Calls send
  the access-token cookie unless given `{ guest: true }`. The app must call
  `ApiClient.configure({ refreshUrl })` once (`endpoints.ts` does) so the client
  knows where to refresh. **It never throws** — every path resolves to
  a discriminated `ApiClientResponse<T>`, so callers branch on `success` rather
  than wrapping calls in `try`/`catch`. On a 401/403 it refreshes the access
  token once and replays the original request; a second failure is returned as
  the final error. Concurrent refreshes share one in-flight promise.
- `src/utils/cookies` → `@repo/frontend/utils/cookies`. `"use server"` accessors
  over `next/headers`, keyed by the `Cookies` enum. Auth tokens are stored
  httpOnly, so they are readable from server actions only — never from the
  browser.

Both are `index.ts`, not `index.tsx`, so each needs an exact key in the
`package.json` `exports` map — the `./*` wildcard only resolves `.tsx` barrels.
The same applies to `./ui` (matching shadcn's own file naming) and
`./styles/theme.css` (not a JS/TS module at all), imported with
`@import "@repo/frontend/styles/theme.css";`.
