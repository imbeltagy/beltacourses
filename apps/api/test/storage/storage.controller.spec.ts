import { Test, TestingModule } from '@nestjs/testing';
import {
  AccessTokenGuard,
  PermissionsGuard,
  RolesGuard,
} from '@repo/service/core';
import { StorageService } from '../../src/storage/storage.service';
import { StorageController } from '../../src/storage/storage.controller';
import { FileMetadata } from '@repo/db';

const metadata = (): FileMetadata =>
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
  }) as FileMetadata;

const multerFile = (name: string): Express.Multer.File =>
  ({
    buffer: Buffer.from(name),
    originalname: name,
    mimetype: 'image/png',
    size: 1024,
  }) as Express.Multer.File;

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: {
    uploadMany: jest.Mock;
    getById: jest.Mock;
    softDeleteMany: jest.Mock;
    upload: jest.Mock;
    softDelete: jest.Mock;
    hardDelete: jest.Mock;
  };

  beforeEach(async () => {
    storageService = {
      uploadMany: jest.fn(),
      getById: jest.fn(),
      softDeleteMany: jest.fn(),
      upload: jest.fn(),
      softDelete: jest.fn(),
      hardDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: storageService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(StorageController);
  });

  describe('upload', () => {
    it('delegates the whole list to uploadMany and returns it unchanged', async () => {
      const uploaded = [
        { id: 'a', url: 'url-a' },
        { id: 'b', url: 'url-b' },
      ];
      storageService.uploadMany.mockResolvedValue(uploaded);
      const files = [multerFile('a.png'), multerFile('b.png')];

      await expect(controller.upload(files)).resolves.toBe(uploaded);
      expect(storageService.uploadMany).toHaveBeenCalledWith(files);
    });

    it('returns an array even for a single file', async () => {
      storageService.uploadMany.mockResolvedValue([{ id: 'a', url: 'url-a' }]);

      await expect(controller.upload([multerFile('a.png')])).resolves.toEqual([
        { id: 'a', url: 'url-a' },
      ]);
    });

    it('never calls the single-file upload method', async () => {
      storageService.uploadMany.mockResolvedValue([]);

      await controller.upload([multerFile('a.png')]);

      expect(storageService.upload).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('delegates to getById and returns the metadata', async () => {
      const row = metadata();
      storageService.getById.mockResolvedValue(row);

      await expect(controller.getById('file-id')).resolves.toBe(row);
      expect(storageService.getById).toHaveBeenCalledWith('file-id');
    });

    it('lets a NotFoundException from the service propagate', async () => {
      storageService.getById.mockRejectedValue(new Error('File x not found'));

      await expect(controller.getById('file-id')).rejects.toThrow(
        'File x not found',
      );
    });
  });

  describe('softDelete', () => {
    it('passes dto.ids to softDeleteMany and wraps the result', async () => {
      storageService.softDeleteMany.mockResolvedValue(['a']);

      await expect(controller.softDelete({ ids: ['a', 'b'] })).resolves.toEqual(
        { deleted: ['a'] },
      );
      expect(storageService.softDeleteMany).toHaveBeenCalledWith(['a', 'b']);
    });

    it('reports an empty list rather than failing when nothing transitioned', async () => {
      storageService.softDeleteMany.mockResolvedValue([]);

      await expect(
        controller.softDelete({ ids: ['unknown'] }),
      ).resolves.toEqual({ deleted: [] });
    });

    it('calls the soft delete, never the hard one', async () => {
      storageService.softDeleteMany.mockResolvedValue([]);

      await controller.softDelete({ ids: ['a'] });

      expect(storageService.hardDelete).not.toHaveBeenCalled();
    });
  });

  describe('HTTP surface', () => {
    it('exposes no hard-delete route', () => {
      const handlers = Object.getOwnPropertyNames(StorageController.prototype);

      expect(handlers).toEqual(
        expect.not.arrayContaining(['hardDelete', 'delete', 'destroy']),
      );
      expect(handlers.sort()).toEqual(
        ['constructor', 'getById', 'softDelete', 'upload'].sort(),
      );
    });
  });
});
