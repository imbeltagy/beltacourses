# `@repo/eslint-config`

Shared ESLint flat configs. A project imports the one that matches what it is
and nothing else.

| Export                         | For                                   | Builds on |
| ------------------------------ | ------------------------------------- | --------- |
| `@repo/eslint-config/base`     | Framework-agnostic rules              | —         |
| `@repo/eslint-config/react`    | Browser React packages (`@repo/frontend`) | `base` |
| `@repo/eslint-config/next`     | Next.js apps and `@repo/frontend-features` | `react` |
| `@repo/eslint-config/nestjs`   | Nest apps and `@repo/backend` (type-aware) | `base` |
| `@repo/eslint-config/node`     | Plain Node code (`@repo/db`)          | `base`    |

```js
// eslint.config.mjs — most projects
import { config } from "@repo/eslint-config/next";
export default config;

// Nest needs the project directory to find its tsconfig
import { createConfig } from "@repo/eslint-config/nestjs";
export default createConfig({ tsconfigRootDir: import.meta.dirname });
```

## What `base` enforces

- No unused variables, parameters, caught errors or imports — unless the name
  starts with `_`.
- `no-console` warns (`console.warn` / `console.error` are allowed).
- `eqeqeq`, `prefer-const`, `no-var`, `no-debugger`, and a description on
  `@ts-expect-error`.
- `no-explicit-any` and non-null assertions warn.
- `turbo/no-undeclared-env-vars` warns — declare new variables in `globalEnv`.

`react` adds the rules of hooks and `react-hooks/exhaustive-deps` (both
errors), `jsx-a11y`, and the usual React correctness rules. `nestjs` adds
type-aware promise rules and Prettier.

Lint runs with `--max-warnings 0`, so a warning fails the task.
