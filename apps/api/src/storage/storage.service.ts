import { Injectable, Logger } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { S3Adapter } from './s3.adapter';
import { StorageRepository } from './storage.repository';
import type { FileToUpload, UploadedFile } from './storage.types';
import { FileMetadata } from '@repo/db';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly repository: StorageRepository,
    private readonly s3: S3Adapter,
  ) {}

  /** `2026/08/<uuid>.png` */
  private generateKey(originalName: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}/${month}/${randomUUID()}${extname(originalName)}`;
  }

  /**
   * Uploads one file. All-or-nothing: if the metadata write fails after the object
   * landed in S3, the object is removed so no orphan is left behind.
   */
  async upload(file: FileToUpload): Promise<FileMetadata> {
    const key = this.generateKey(file.originalname);

    await this.s3.upload(key, file.buffer, file.mimetype);

    try {
      return await this.repository.create({
        key,
        url: this.s3.getUrl(key),
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        bucket: this.s3.getBucket(),
      });
    } catch (error) {
      await this.s3.delete(key).catch((cleanupError) => {
        this.logger.error(
          `Orphaned S3 object left behind at key ${key}`,
          cleanupError,
        );
      });
      throw error;
    }
  }

  async uploadMany(files: FileToUpload[]): Promise<UploadedFile[]> {
    const uploaded = await Promise.all(files.map((file) => this.upload(file)));
    return uploaded.map(({ id, url }) => ({ id, url }));
  }

  async getById(id: string): Promise<FileMetadata> {
    const file = await this.repository.findById(id);
    if (!file) throw new AppException(ErrorCode.FILE_NOT_FOUND);
    return file;
  }

  /** Marks the metadata deleted. The object stays in S3 until the cleanup worker runs. */
  async softDelete(id: string): Promise<void> {
    const changed = await this.repository.softDelete(id);
    if (changed === 0) throw new AppException(ErrorCode.FILE_NOT_FOUND);
  }

  async softDeleteMany(ids: string[]): Promise<string[]> {
    const deleted = await this.repository.softDeleteMany(ids);
    return deleted.map(({ id }) => id);
  }

  // Delete metadata and delete S3 object
  async hardDelete(id: string): Promise<void> {
    const file = await this.repository.findByIdIncludingDeleted(id);
    if (!file) throw new AppException(ErrorCode.FILE_NOT_FOUND);

    await this.s3.delete(file.key);
    await this.repository.hardDelete(id);
  }
}
