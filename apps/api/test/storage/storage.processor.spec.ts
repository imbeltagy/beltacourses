import { Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Adapter } from '../../src/storage/s3.adapter';
import { STORAGE_CLEANUP_QUEUE } from '../../src/storage/storage.constants';
import { StorageProcessor } from '../../src/storage/storage.processor';
import { StorageRepository } from '../../src/storage/storage.repository';
import { FileMetadata } from '@repo/db';

const row = (i: number): FileMetadata =>
  ({
    id: `id-${i}`,
    key: `2026/08/key-${i}.png`,
    deleted_at: new Date('2026-08-01T00:00:00.000Z'),
  }) as FileMetadata;

const page = (from: number, count: number): FileMetadata[] =>
  Array.from({ length: count }, (_, i) => row(from + i));

describe('StorageProcessor', () => {
  let processor: StorageProcessor;
  let queue: { upsertJobScheduler: jest.Mock };
  let repository: { findSoftDeleted: jest.Mock; hardDelete: jest.Mock };
  let s3: { delete: jest.Mock };

  beforeEach(async () => {
    queue = { upsertJobScheduler: jest.fn().mockResolvedValue({}) };
    repository = {
      findSoftDeleted: jest.fn().mockResolvedValue([]),
      hardDelete: jest.fn().mockResolvedValue(undefined),
    };
    s3 = { delete: jest.fn().mockResolvedValue(undefined) };

    // The processor logs expected failures; keep the test output readable.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageProcessor,
        { provide: getQueueToken(STORAGE_CLEANUP_QUEUE), useValue: queue },
        { provide: StorageRepository, useValue: repository },
        { provide: S3Adapter, useValue: s3 },
      ],
    }).compile();

    processor = module.get(StorageProcessor);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('registers the weekly schedule under a stable id', async () => {
      await processor.onModuleInit();

      expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
        'storage-weekly-cleanup',
        { pattern: '0 0 * * 0' },
        { name: 'cleanup' },
      );
    });

    it('is safe to call repeatedly — upsert, not add', async () => {
      await processor.onModuleInit();
      await processor.onModuleInit();

      expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(2);
      expect(queue.upsertJobScheduler.mock.calls[0]).toEqual(
        queue.upsertJobScheduler.mock.calls[1],
      );
    });
  });

  describe('process', () => {
    it('does nothing when no file is soft-deleted', async () => {
      repository.findSoftDeleted.mockResolvedValue([]);

      await expect(processor.process()).resolves.toEqual({
        removed: 0,
        failed: 0,
      });
      expect(s3.delete).not.toHaveBeenCalled();
      expect(repository.hardDelete).not.toHaveBeenCalled();
    });

    it('drains every page in a single run', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce(page(0, 100))
        .mockResolvedValueOnce(page(100, 100))
        .mockResolvedValueOnce([]);

      await expect(processor.process()).resolves.toEqual({
        removed: 200,
        failed: 0,
      });
      expect(s3.delete).toHaveBeenCalledTimes(200);
      expect(repository.hardDelete).toHaveBeenCalledTimes(200);
    });

    it('asks for one page at a time, sized by the constant', async () => {
      repository.findSoftDeleted.mockResolvedValue([]);

      await processor.process();

      expect(repository.findSoftDeleted).toHaveBeenCalledWith(100);
    });

    it('removes the object before the row', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1)])
        .mockResolvedValueOnce([]);
      const order: string[] = [];
      s3.delete.mockImplementation(() => {
        order.push('s3');
        return Promise.resolve();
      });
      repository.hardDelete.mockImplementation(() => {
        order.push('db');
        return Promise.resolve();
      });

      await processor.process();

      expect(order).toEqual(['s3', 'db']);
      expect(s3.delete).toHaveBeenCalledWith('2026/08/key-1.png');
      expect(repository.hardDelete).toHaveBeenCalledWith('id-1');
    });

    it('counts a failing file and carries on with the rest of the page', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1), row(2), row(3)])
        .mockResolvedValueOnce([]);
      s3.delete.mockImplementation((key: string) =>
        key === '2026/08/key-2.png'
          ? Promise.reject(new Error('s3 down'))
          : Promise.resolve(),
      );

      await expect(processor.process()).resolves.toEqual({
        removed: 2,
        failed: 1,
      });
      expect(repository.hardDelete).toHaveBeenCalledWith('id-1');
      expect(repository.hardDelete).toHaveBeenCalledWith('id-3');
      expect(repository.hardDelete).not.toHaveBeenCalledWith('id-2');
    });

    it('leaves the row in place when its object could not be removed', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1)])
        .mockResolvedValueOnce([]);
      s3.delete.mockRejectedValue(new Error('s3 down'));

      await processor.process();

      expect(repository.hardDelete).not.toHaveBeenCalled();
    });

    it('logs each failure', async () => {
      const error = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1)])
        .mockResolvedValueOnce([]);
      s3.delete.mockRejectedValue(new Error('s3 down'));

      await processor.process();

      expect(error).toHaveBeenCalledWith(
        'Failed to clean up file id-1',
        expect.any(Error),
      );
    });

    it('stops instead of re-fetching a page in which every file failed', async () => {
      // Always returns the same page — a naive loop would spin forever.
      repository.findSoftDeleted.mockResolvedValue([row(1), row(2)]);
      s3.delete.mockRejectedValue(new Error('s3 down'));

      await expect(processor.process()).resolves.toEqual({
        removed: 0,
        failed: 2,
      });
      expect(repository.findSoftDeleted).toHaveBeenCalledTimes(1);
    });

    it('keeps draining while at least one file per page succeeds', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1), row(2)])
        .mockResolvedValueOnce([row(3)])
        .mockResolvedValueOnce([]);
      s3.delete.mockImplementation((key: string) =>
        key === '2026/08/key-2.png'
          ? Promise.reject(new Error('s3 down'))
          : Promise.resolve(),
      );

      await expect(processor.process()).resolves.toEqual({
        removed: 2,
        failed: 1,
      });
      expect(repository.findSoftDeleted).toHaveBeenCalledTimes(3);
    });

    it('removes nothing on a second consecutive run', async () => {
      repository.findSoftDeleted
        .mockResolvedValueOnce([row(1)])
        .mockResolvedValue([]);

      await expect(processor.process()).resolves.toEqual({
        removed: 1,
        failed: 0,
      });
      await expect(processor.process()).resolves.toEqual({
        removed: 0,
        failed: 0,
      });
    });
  });
});
