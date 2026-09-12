# @repo/frontend

Shared shadcn/ui primitives, theme, fonts, and form/layout components used by every
frontend app in this repo (`apps/client`, and future frontend apps).

## Adding a new shadcn component

Run the shadcn CLI from **this package's directory** so it reads `components.json`
here and writes into `src/ui`:

```sh
cd packages/frontend/common
pnpm dlx shadcn@latest add <component>
```

The CLI writes a flat `src/ui/<name>.tsx` file, same as any shadcn project — add
one line for it to `src/ui/index.ts`: `export * from "./<name>.tsx";`.

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
  - `src/layout/<name>` — shared page shells (e.g. the auth split-screen layout),
    imported as `@repo/frontend/layout/<name>`.
  - `src/utils` — the `cn()` helper, imported as `@repo/frontend/utils`.

Two exceptions to the wildcard, both exact keys in `package.json` `exports`:
`./ui` (barrel is `index.ts`, not `index.tsx`, to match shadcn's own file naming)
and `./styles/theme.css` (not a JS/TS module) — imported with
`@import "@repo/frontend/styles/theme.css";`.
