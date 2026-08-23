import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { StorageRepository } from './storage.repository';
import { S3Adapter } from './s3.adapter';
import {
  STORAGE_CLEANUP_CRON,
  STORAGE_CLEANUP_PAGE_SIZE,
  STORAGE_CLEANUP_QUEUE,
  STORAGE_CLEANUP_SCHEDULER_ID,
} from './storage.constants';

@Processor(STORAGE_CLEANUP_QUEUE)
export class StorageProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(StorageProcessor.name);

  constructor(
    @InjectQueue(STORAGE_CLEANUP_QUEUE) private readonly queue: Queue,
    private readonly repository: StorageRepository,
    private readonly s3: S3Adapter,
  ) {
    super();
  }

  /** upsertJobScheduler is idempotent — safe on every boot and every replica. */
  async onModuleInit(): Promise<void> {
    await this.queue.upsertJobScheduler(
      STORAGE_CLEANUP_SCHEDULER_ID,
      { pattern: STORAGE_CLEANUP_CRON },
      { name: 'cleanup' },
    );
  }

  async process(): Promise<{ removed: number; failed: number }> {
    let removed = 0;
    let failed = 0;

    // Page and skipp failed until nothing left except for failed to try on next scheduled run.
    for (;;) {
      const page = await this.repository.findSoftDeleted({
        take: STORAGE_CLEANUP_PAGE_SIZE,
        skip: failed,
      });
      if (page.length === 0) break;

      let removedInPage = 0;
      for (const file of page) {
        try {
          await this.s3.delete(file.key);
          await this.repository.hardDelete(file.id);
          removed += 1;
          removedInPage += 1;
        } catch (error) {
          // Leave the row in place; the next run retries it.
          failed += 1;
          this.logger.error(`Failed to clean up file ${file.id}`, error);
        }
      }

      // A page with zero progress will come back unchanged forever — stop instead
      // of spinning on the same unprocessable rows.
      if (removedInPage === 0) break;
    }

    this.logger.log(
      `Storage cleanup removed ${removed} file(s), ${failed} failed`,
    );
    return { removed, failed };
  }
}
