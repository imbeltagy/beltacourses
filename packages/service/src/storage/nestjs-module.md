# StorageModule (app-side)

`@repo/service/storage` ships providers only. Each app declares its own module.
Create `src/storage/storage.module.ts` in your app with:

```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import {
  S3Adapter,
  StorageProcessor,
  StorageRepository,
  StorageService,
  STORAGE_CLEANUP_QUEUE,
} from '@repo/service/storage';
import { StorageController } from './storage.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: STORAGE_CLEANUP_QUEUE }),
    BullBoardModule.forFeature({
      name: STORAGE_CLEANUP_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, StorageRepository, S3Adapter, StorageProcessor],
  exports: [StorageService],
})
export class StorageModule {}
```

## Requirements

- `PrismaModule` from `@repo/service/prisma` must be imported somewhere in the app.
  It is `@Global()`, so importing it once in `AppModule` is enough — `StorageRepository`
  depends on `PrismaService`.
- `BullModule.forRoot({ connection: { host, port } })` must be registered once in
  `AppModule`, before any `registerQueue`.
- `BullBoardModule.forRoot({ route, adapter })` must be registered once in `AppModule`
  before any `forFeature`. Drop both BullBoard lines if the app has no queue UI.
- `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` must be set.
  `S3Adapter` throws on construction if any is missing, which fails app boot loudly.

## Notes

- Export **only** `StorageService`. `StorageRepository` and `S3Adapter` are internals;
  other modules must not inject them.
- Drop `StorageProcessor` from `providers` in an app that should not run the cleanup
  worker (e.g. a second app sharing the same database). Exactly one deployment should
  own the schedule.
- The controller receives Multer files and passes them straight to `StorageService`.
  That works because `FileToUpload` is a structural type — the package never imports
  Express or Multer. Keep it that way: do not widen a package signature to
  `Express.Multer.File`.
