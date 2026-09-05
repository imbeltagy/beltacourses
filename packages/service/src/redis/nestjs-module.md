# redis

`@repo/service/redis` ships the one shared Redis handle for the app, modelled on
`@repo/service/prisma` — a single connection must be shared app-wide, so this is the one package
here that does ship a module.

## Wiring

Import `RedisModule` once in `AppModule`:

```ts
import { RedisModule } from '@repo/service/redis';

@Module({ imports: [RedisModule /* ... */] })
export class AppModule {}
```

`RedisModule` is `@Global()`, exactly like `PrismaModule`, so any provider anywhere in the app can
inject `RedisService` without its own module importing `RedisModule` again — this is what lets
`SessionService` in `core` reach Redis with no module edge to wire.

Inject it and use `this.redis.client` (an `ioredis` instance) for raw commands:

```ts
constructor(private readonly redis: RedisService) {}
```

## Env vars

- `REDIS_HOST` (optional, defaults to `'localhost'`)
- `REDIS_PORT` (optional, defaults to `6379`)

## Notes

- **BullMQ keeps its own separate connection pool on purpose.** BullMQ issues blocking commands
  (`BLPOP` and friends) that would stall every other command on a shared connection, so
  `BullModule.forRoot({ connection: { host, port } })` in `apps/api` is a second, independent
  `ioredis` client. Do not try to make BullMQ share `RedisService`'s connection.
- `RedisService.ping()` is what `HealthCheckService` calls instead of opening its own throwaway
  connection per request.
