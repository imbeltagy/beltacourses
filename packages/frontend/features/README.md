# @repo/frontend-features

Everything that belongs to a product surface rather than to a design system:
pages, the server actions behind them, the API types those actions speak, and the
page shells they render into.

The split against [`@repo/frontend`](../common/README.md) is "would a second app
reuse this unchanged?" — a `Button` yes, the login page no.

## Why the pages live here and not in the app

`apps/client` is **a router and nothing else**. A route file does one thing:

```tsx
// apps/client/src/app/(auth)/login/page.tsx
export { default } from "@repo/frontend-features/pages/auth/login";
```

So when `apps/admin` arrives it mounts the same page under its own URL without
either app owning the implementation, and a page can move between URLs without
its code moving. Anything that genuinely cannot leave the app — a route handler,
`middleware.ts`, `not-found.tsx` — stays in the app.

## Layout

One export pattern, `"./*": "./src/*/index.tsx"`, so
`@repo/frontend-features/<path>/<name>` resolves to `src/<path>/<name>/index.tsx`.

```
src/
├── pages/<area>/<page>/
│   ├── index.tsx        the page — a server component, re-exported by the app
│   ├── components/      markup used by this page only
│   └── hooks/           this page's state and submit handlers
├── layout/<name>/       page shells (auth-layout, dashboard-layout, ...)
├── actions/             "use server" entry points, one file per API area
├── types/api/           request/response shapes for those actions
├── configs/             endpoints and other per-feature constants
└── hooks/               cross-page hooks (none yet)
```

### The page triad

A page directory splits three ways so that each part changes for one reason:

- **`index.tsx`** stays a server component and holds the static half — headings,
  copy, anything that does not need hydration.
- **`components/`** holds the `"use client"` markup. It reads state from a hook
  and renders it; it contains no schema and no API call.
- **`hooks/`** owns the form schema, the `useForm` instance and the submit
  handler. Changing which action a form posts to touches this file and nothing
  else.

Only `index.tsx` is reachable from outside the package — `components/` and
`hooks/` are private to their page by virtue of the export pattern.

### Actions and types

Server actions are grouped by API area (`auth-actions.ts`, `users-actions.ts`),
not by page, because two pages often hit the same endpoint. They call
`@repo/frontend/utils/api-client` and return its discriminated
`ApiClientResponse`-shaped result, so a page's hook branches on `success`.

`types/api/` mirrors the API's wire shapes. These are hand-written rather than
generated from the OpenAPI schema for now; if that becomes a drift problem the
generator is the fix, not looser types.
