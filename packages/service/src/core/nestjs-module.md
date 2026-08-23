# core (app-side)

`@repo/service/core` ships providers only, like every package here — no module, no controller.
Unlike other packages, there is no single orchestrating service and no one `CoreModule` to wire:
`core` is a small set of independent, dependency-light primitives (password hashing, stateless
bearer-token signing/verification, the guard that checks one, and a decorator that reads what the
guard attached). Every consuming app feature lists exactly the pieces it needs directly in its own
module's `providers` array.

This exists to let an "auth" feature and a "users" feature depend on the same credential/token
primitives **without depending on each other** — see the rationale below.

## A feature that hashes passwords and protects its own routes (e.g. `UsersModule`)

```ts
import { Module } from '@nestjs/common';
import {
  PasswordService,
  TokenService,
  AccessTokenGuard,
  UsersRepository as AccessCheckRepository,
} from '@repo/service/core';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    PasswordService,
    TokenService,
    AccessCheckRepository,
    AccessTokenGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
```

`UsersRepository` is aliased because the feature already has its own, full-CRUD repository of the
same name — `core`'s version is a different, much narrower class (see Notes).

## A feature that issues tokens (e.g. `AuthModule`)

```ts
import { Module } from '@nestjs/common';
import { TokenService } from '@repo/service/core';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
```

`AuthModule` importing `UsersModule` here is fine and not circular: it is the only edge between the
two. `UsersModule` never imports `AuthModule` — it gets everything token-related from `core`
directly, which is the whole point of pulling these primitives out of either feature.

## Requirements

- `PASSWORD_SALT` (required) and `PASSWORD_SALT_ROUNDS` (optional, defaults to `12`, must be an
  integer 4–15) — read by `PasswordService`, validated in its constructor.
- `ACCESS_TOKEN_SECRET` (required) — read by `TokenService`, validated in its constructor.
- `PrismaModule` from `@repo/service/prisma` must be imported somewhere in the app (it is
  `@Global()`) — `core`'s `UsersRepository` depends on `PrismaService`.

## Notes

- **Why no module.** A shared `CoreModule` would have to be imported by both `UsersModule` and
  `AuthModule`, or by whichever one owns the guard — and if the guard's module were `auth`,
  `UsersModule` would need to import it too (to resolve `AccessTokenGuard` via DI on its own
  controller), which combined with `AuthModule` importing `UsersModule` is a cycle. Shipping bare
  providers instead means every feature reaches into `core` directly — no module edge is created
  either way, so there is nothing to cycle.
- **`core`'s `UsersRepository` is not a general users data layer.** It exists solely so
  `AccessTokenGuard` can confirm a token's user still exists (tokens never expire, so this is the
  only revocation check there is) — one `findById` returning just `{ id }`. A feature's own,
  full-featured users repository is a separate class and stays in that feature.
- Only `TokenService` needs to be listed twice across features (once wherever tokens are signed,
  once wherever `AccessTokenGuard` verifies them) — it is stateless and config-only, so two
  instances behave identically.
- `PasswordService` is intentionally not exported by any feature's own module `exports` — the
  password hash should never leave the feature that owns the user record.
