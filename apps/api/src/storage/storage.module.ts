import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { S3Adapter } from './s3.adapter';
import { StorageProcessor } from './storage.processor';
import { StorageRepository } from './storage.repository';
import { StorageService } from './storage.service';
import { STORAGE_CLEANUP_QUEUE } from './storage.constants';
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
