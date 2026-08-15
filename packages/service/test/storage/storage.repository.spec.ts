import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma';
import { StorageRepository } from '../../src/storage/storage.repository';
import { FileMetadata } from '@repo/db';

const file = (overrides: Partial<FileMetadata> = {}): FileMetadata =>
  ({
    id: 'file-id',
    key: '2026/08/abc.png',
    url: 'https://my-bucket.s3.eu-central-1.amazonaws.com/2026/08/abc.png',
    name: 'abc.png',
    size: 1024,
    mime_type: 'image/png',
    bucket: 'my-bucket',
    created_at: new Date('2026-08-01T00:00:00.000Z'),
    deleted_at: null,
    ...overrides,
  }) as FileMetadata;

describe('StorageRepository', () => {
  let repository: StorageRepository;
  let prisma: {
    client: {
      file: {
        create: jest.Mock;
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        findMany: jest.Mock;
        updateMany: jest.Mock;
        updateManyAndReturn: jest.Mock;
        delete: jest.Mock;
      };
    };
  };

  beforeEach(async () => {
    prisma = {
      client: {
        file: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          findMany: jest.fn(),
          updateMany: jest.fn(),
          updateManyAndReturn: jest.fn(),
          delete: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(StorageRepository);
  });

  describe('create', () => {
    it('passes the snake_case payload straight through', async () => {
      const row = file();
      prisma.client.file.create.mockResolvedValue(row);

      const data = {
        key: '2026/08/abc.png',
        url: 'https://my-bucket.s3.eu-central-1.amazonaws.com/2026/08/abc.png',
        name: 'abc.png',
        size: 1024,
        mime_type: 'image/png',
        bucket: 'my-bucket',
      };

      await expect(repository.create(data)).resolves.toBe(row);
      expect(prisma.client.file.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findById', () => {
    it('filters out soft-deleted rows', async () => {
      prisma.client.file.findFirst.mockResolvedValue(null);

      await repository.findById('file-id');

      expect(prisma.client.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'file-id', deleted_at: null },
      });
    });

    it('returns null when nothing live matches', async () => {
      prisma.client.file.findFirst.mockResolvedValue(null);

      await expect(repository.findById('file-id')).resolves.toBeNull();
    });
  });

  describe('findByIdIncludingDeleted', () => {
    it('does not filter on deleted_at', async () => {
      const row = file({ deleted_at: new Date() });
      prisma.client.file.findUnique.mockResolvedValue(row);

      await expect(
        repository.findByIdIncludingDeleted('file-id'),
      ).resolves.toBe(row);
      expect(prisma.client.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'file-id' },
      });
    });
  });

  describe('softDelete', () => {
    it('guards on deleted_at: null so a re-delete cannot move the timestamp', async () => {
      prisma.client.file.updateMany.mockResolvedValue({ count: 1 });

      await repository.softDelete('file-id');

      expect(prisma.client.file.updateMany).toHaveBeenCalledWith({
        where: { id: 'file-id', deleted_at: null },
        data: { deleted_at: expect.any(Date) as Date },
      });
    });

    it('returns the number of rows changed', async () => {
      prisma.client.file.updateMany.mockResolvedValue({ count: 1 });
      await expect(repository.softDelete('file-id')).resolves.toBe(1);

      prisma.client.file.updateMany.mockResolvedValue({ count: 0 });
      await expect(repository.softDelete('file-id')).resolves.toBe(0);
    });
  });

  describe('softDeleteMany', () => {
    it('matches on the id list and the deleted_at guard together', async () => {
      prisma.client.file.updateManyAndReturn.mockResolvedValue([]);

      await repository.softDeleteMany(['a', 'b']);

      expect(prisma.client.file.updateManyAndReturn).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] }, deleted_at: null },
        data: { deleted_at: expect.any(Date) as Date },
      });
    });

    it('returns only the rows that actually transitioned', async () => {
      const row = file({ id: 'a' });
      prisma.client.file.updateManyAndReturn.mockResolvedValue([row]);

      await expect(repository.softDeleteMany(['a', 'b'])).resolves.toEqual([
        row,
      ]);
    });
  });

  describe('hardDelete', () => {
    it('removes the row and never touches S3', async () => {
      prisma.client.file.delete.mockResolvedValue(file());

      await repository.hardDelete('file-id');

      expect(prisma.client.file.delete).toHaveBeenCalledWith({
        where: { id: 'file-id' },
      });
    });
  });

  describe('findSoftDeleted', () => {
    it('selects deleted rows oldest first, limited to the page size', async () => {
      prisma.client.file.findMany.mockResolvedValue([]);

      await repository.findSoftDeleted(0, 100);

      expect(prisma.client.file.findMany).toHaveBeenCalledWith({
        where: { deleted_at: { not: null } },
        orderBy: { deleted_at: 'asc' },
        take: 100,
      });
    });
  });
});
