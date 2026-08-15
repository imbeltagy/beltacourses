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
