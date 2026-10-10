# files

Standalone Express server for static assets. No `@repo/*` dependencies.

- `GET /assets/<path>` serves `assets/<path>`; anything else, including missing files, directories,
  dotfiles and other methods, is a 404 with the API's shape: `{ "code": 404, "error": "NOT_FOUND" }`.
- `pnpm --filter files dev` starts it on `PORT` (default 3004). `pnpm --filter files test` runs the tests.
- Add files under `assets/`; no code change needed.
