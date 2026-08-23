import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Adapter } from '../../src/storage/s3.adapter';
import { StorageRepository } from '../../src/storage/storage.repository';
import { StorageService } from '../../src/storage/storage.service';
import type { FileToUpload } from '../../src/storage/storage.types';
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

const upload = (overrides: Partial<FileToUpload> = {}): FileToUpload => ({
  buffer: Buffer.from('contents'),
  originalname: 'abc.png',
  mimetype: 'image/png',
  size: 1024,
  ...overrides,
});

describe('StorageService', () => {
  let service: StorageService;
  let repository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByIdIncludingDeleted: jest.Mock;
    softDelete: jest.Mock;
    softDeleteMany: jest.Mock;
    hardDelete: jest.Mock;
    findSoftDeleted: jest.Mock;
  };
  let s3: {
    upload: jest.Mock;
    delete: jest.Mock;
    getUrl: jest.Mock;
    getBucket: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdIncludingDeleted: jest.fn(),
      softDelete: jest.fn(),
      softDeleteMany: jest.fn(),
      hardDelete: jest.fn(),
      findSoftDeleted: jest.fn(),
    };
    s3 = {
      upload: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn((key: string) => `https://my-bucket.s3.r.example/${key}`),
      getBucket: jest.fn(() => 'my-bucket'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: StorageRepository, useValue: repository },
        { provide: S3Adapter, useValue: s3 },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upload', () => {
    it('sends the object to S3 before writing metadata', async () => {
      repository.create.mockResolvedValue(file());
      const order: string[] = [];
      s3.upload.mockImplementation(() => {
        order.push('s3');
        return Promise.resolve();
      });
      repository.create.mockImplementation(() => {
        order.push('db');
        return Promise.resolve(file());
      });

      await service.upload(upload());

      expect(order).toEqual(['s3', 'db']);
    });

    it('writes the generated key, url, bucket and snake_case fields', async () => {
      repository.create.mockResolvedValue(file());

      await service.upload(upload());

      const [data] = repository.create.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(data).toEqual({
        key: expect.stringMatching(
          /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/,
        ) as string,
        url: `https://my-bucket.s3.r.example/${String(data.key)}`,
        name: 'abc.png',
        size: 1024,
        mime_type: 'image/png',
        bucket: 'my-bucket',
      });
    });

    it('uploads to S3 under that same key, with the declared mime type', async () => {
      repository.create.mockResolvedValue(file());
      const body = Buffer.from('contents');

      await service.upload(upload({ buffer: body }));

      const [data] = repository.create.mock.calls[0] as [{ key: string }];
      expect(s3.upload).toHaveBeenCalledWith(data.key, body, 'image/png');
    });

    it('generates a date-prefixed uuid key that keeps the original extension', async () => {
      repository.create.mockResolvedValue(file());

      await service.upload(upload({ originalname: 'my invoice.PDF' }));

      const [data] = repository.create.mock.calls[0] as [{ key: string }];
      expect(data.key).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.PDF$/);
      // The caller's filename must not leak into the public key.
      expect(data.key).not.toContain('invoice');
    });

    it('never reuses a key across uploads of the same filename', async () => {
      repository.create.mockResolvedValue(file());

      await service.upload(upload());
      await service.upload(upload());

      const [first] = repository.create.mock.calls[0] as [{ key: string }];
      const [second] = repository.create.mock.calls[1] as [{ key: string }];
      expect(first.key).not.toBe(second.key);
    });

    it('deletes the orphaned object and rethrows when the metadata write fails', async () => {
      const failure = new Error('db down');
      repository.create.mockRejectedValue(failure);

      await expect(service.upload(upload())).rejects.toThrow(failure);

      const uploadedKey = (s3.upload.mock.calls[0] as [string])[0];
      expect(s3.delete).toHaveBeenCalledWith(uploadedKey);
    });

    it('still rethrows the original error when the cleanup delete also fails, and logs the orphan', async () => {
      const logged = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      repository.create.mockRejectedValue(new Error('db down'));
      s3.delete.mockRejectedValue(new Error('s3 down'));

      // The caller must still see the real cause, not the cleanup failure.
      await expect(service.upload(upload())).rejects.toThrow('db down');

      const uploadedKey = (s3.upload.mock.calls[0] as [string])[0];
      expect(logged).toHaveBeenCalledWith(
        `Orphaned S3 object left behind at key ${uploadedKey}`,
        expect.any(Error),
      );
    });

    it('does not delete anything when the metadata write succeeds', async () => {
      repository.create.mockResolvedValue(file());

      await service.upload(upload());

      expect(s3.delete).not.toHaveBeenCalled();
    });
  });

  describe('uploadMany', () => {
    it('returns one { id, url } per file, in input order', async () => {
      repository.create
        .mockResolvedValueOnce(file({ id: 'first', url: 'url-1' }))
        .mockResolvedValueOnce(file({ id: 'second', url: 'url-2' }))
        .mockResolvedValueOnce(file({ id: 'third', url: 'url-3' }));

      await expect(
        service.uploadMany([
          upload({ originalname: 'a.png' }),
          upload({ originalname: 'b.png' }),
          upload({ originalname: 'c.png' }),
        ]),
      ).resolves.toEqual([
        { id: 'first', url: 'url-1' },
        { id: 'second', url: 'url-2' },
        { id: 'third', url: 'url-3' },
      ]);
    });

    it('returns an empty array for an empty input', async () => {
      await expect(service.uploadMany([])).resolves.toEqual([]);
      expect(s3.upload).not.toHaveBeenCalled();
    });

    it('rejects when any one file fails', async () => {
      repository.create
        .mockResolvedValueOnce(file())
        .mockRejectedValueOnce(new Error('db down'));

      await expect(service.uploadMany([upload(), upload()])).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('getById', () => {
    it('returns the row when it is live', async () => {
      const row = file();
      repository.findById.mockResolvedValue(row);

      await expect(service.getById('file-id')).resolves.toBe(row);
    });

    it('throws NotFoundException when the repository finds nothing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('file-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('resolves when a row transitioned', async () => {
      repository.softDelete.mockResolvedValue(1);

      await expect(service.softDelete('file-id')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when nothing changed', async () => {
      repository.softDelete.mockResolvedValue(0);

      await expect(service.softDelete('file-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not remove the object from S3', async () => {
      repository.softDelete.mockResolvedValue(1);

      await service.softDelete('file-id');

      expect(s3.delete).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteMany', () => {
    it('returns only the ids that transitioned', async () => {
      repository.softDeleteMany.mockResolvedValue([
        file({ id: 'a' }),
        file({ id: 'c' }),
      ]);

      await expect(service.softDeleteMany(['a', 'b', 'c'])).resolves.toEqual([
        'a',
        'c',
      ]);
    });

    it('does not throw when every id is unknown', async () => {
      repository.softDeleteMany.mockResolvedValue([]);

      await expect(service.softDeleteMany(['nope'])).resolves.toEqual([]);
    });
  });

  describe('hardDelete', () => {
    it('removes the object from S3 before removing the row', async () => {
      repository.findByIdIncludingDeleted.mockResolvedValue(
        file({ key: '2026/08/abc.png' }),
      );
      const order: string[] = [];
      s3.delete.mockImplementation(() => {
        order.push('s3');
        return Promise.resolve();
      });
      repository.hardDelete.mockImplementation(() => {
        order.push('db');
        return Promise.resolve();
      });

      await service.hardDelete('file-id');

      expect(order).toEqual(['s3', 'db']);
      expect(s3.delete).toHaveBeenCalledWith('2026/08/abc.png');
    });

    it('finds the row even though it is soft-deleted', async () => {
      repository.findByIdIncludingDeleted.mockResolvedValue(
        file({ deleted_at: new Date() }),
      );

      await service.hardDelete('file-id');

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('keeps the row when the S3 delete fails, so the next run can retry', async () => {
      repository.findByIdIncludingDeleted.mockResolvedValue(file());
      s3.delete.mockRejectedValue(new Error('s3 down'));

      await expect(service.hardDelete('file-id')).rejects.toThrow('s3 down');
      expect(repository.hardDelete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown id', async () => {
      repository.findByIdIncludingDeleted.mockResolvedValue(null);

      await expect(service.hardDelete('file-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(s3.delete).not.toHaveBeenCalled();
    });
  });
});
