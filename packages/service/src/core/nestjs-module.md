# core (app-side)

`@repo/service/core` ships providers only, like every package here — no module, no controller.
There is no single orchestrating service and no one `CoreModule` to wire: `core` is a set of
independent, dependency-light primitives (password hashing, JWT signing/verification, the
moderator session store, the permission matcher + repository, the three guards, and the metadata
decorators). Every consuming app feature lists exactly the pieces it needs directly in its own
module's `providers` array.

This exists to let an "auth" feature, a "users" feature, a "groups" feature and a "storage" feature
depend on the same primitives **without depending on each other**.

## Provider list a guarded feature must declare

Any module whose controllers use `@Auth()` (the app-local sugar decorator — see below) must list
the three guards **and their dependencies** in its own `providers` array, because Nest resolves
guard classes through the declaring module's injector:

```ts
import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/service/core';

@Module({
  providers: [
    /* ...this feature's own service/repository... */
    TokenService,
    SessionService,
    PermissionsRepository,
    AccessTokenGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class SomeFeatureModule {}
```

It is repetition by design — `core` ships no module to import, so every feature that guards routes
repeats this same block (`AuthModule`, `UsersModule`, `StorageModule`, `GroupsModule` all do).

## Guard order

`AccessTokenGuard -> RolesGuard -> PermissionsGuard`, always in that order — Nest runs guards in
the order given to `UseGuards`/`applyDecorators`. `AccessTokenGuard` verifies the JWT (and, for
moderators, the Redis session) and attaches `request.user`; `RolesGuard` and `PermissionsGuard`
both read `request.user`, so they must run after it.

## Why `@Auth()` is app-local

The sugar decorator that composes the three guards with `@Roles()`/`@Permissions()` and applies
`@nestjs/swagger` decorators (`ApiBearerAuth`, `ApiUnauthorizedResponse`, `ApiForbiddenResponse`)
lives in `apps/api/src/auth/decorators/auth.decorator.ts`, not here. `CLAUDE.md`'s Swagger section
forbids putting `@ApiProperty`/`@nestjs/swagger` in `packages/service` — OpenAPI is a transport
concern — so anything that touches Swagger has to be app-local.

## Env vars

- `PASSWORD_SALT` (required) and `PASSWORD_SALT_ROUNDS` (optional, defaults to `12`, must be an
  integer 4–15) — read by `PasswordService`, validated in its constructor.
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` (both required, must differ) — read by
  `TokenService`, validated in its constructor with one error naming every missing name at once.
- `REFRESH_TOKEN_HASH_SECRET` (required) — read by `SessionService`, validated in its constructor.
- Both `PrismaModule` (`@repo/service/prisma`) and `RedisModule` (`@repo/service/redis`) must be
  imported somewhere in the app — both are `@Global()`. `PermissionsRepository` depends on
  `PrismaService`; `SessionService` depends on `RedisService`.

## Notes

- **Why no module.** A shared `CoreModule` would have to be imported by every feature that needs
  any of these primitives, and those features already import each other in places (`AuthModule` ->
  `UsersModule`, `GroupsModule` -> `UsersModule`) — adding a common module import creates no new
  cycle by itself, but shipping bare providers means no module edge exists at all, so there is
  nothing to reason about.
- **`TokenService` and the guards need no module either.** They are stateless and config-only
  (`TokenService`, `SessionService`) or read-through (`PermissionsRepository`), so re-declaring them
  as providers in multiple modules is cheap — two instances behave identically.
- `PasswordService` is intentionally not exported by any feature's own module `exports` — the
  password hash should never leave the feature that owns the user record.
- **`PermissionsGuard` is safe to attach even without `@Roles()`.** It refuses every client role
  outright (D9), so a route carrying only `@Permissions(...)` is already staff-only.
