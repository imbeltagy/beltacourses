import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  /** `2026/08/<uuid>.png` — date prefix keeps bucket listings navigable. */
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

  /** Uploads many files, preserving input order in the response. */
  async uploadMany(files: FileToUpload[]): Promise<UploadedFile[]> {
    const uploaded = await Promise.all(files.map((file) => this.upload(file)));
    return uploaded.map(({ id, url }) => ({ id, url }));
  }

  async getById(id: string): Promise<FileMetadata> {
    const file = await this.repository.findById(id);
    if (!file) throw new NotFoundException(`File ${id} not found`);
    return file;
  }

  /** Marks the file deleted. The object stays in S3 until the cleanup worker runs. */
  async softDelete(id: string): Promise<void> {
    const changed = await this.repository.softDelete(id);
    if (changed === 0) throw new NotFoundException(`File ${id} not found`);
  }

  /**
   * Bulk soft delete. Returns the ids that actually transitioned. Unknown or
   * already-deleted ids are silently skipped rather than failing the whole call —
   * partial success is the normal case for a bulk operation, and the caller can
   * diff the response against what it sent.
   */
  async softDeleteMany(ids: string[]): Promise<string[]> {
    const deleted = await this.repository.softDeleteMany(ids);
    return deleted.map(({ id }) => id);
  }

  /**
   * Irreversible. NOT exposed over HTTP — only the cleanup worker calls this.
   * S3 first: if S3 fails we keep the row so the file is still reachable for a
   * retry on the next run.
   */
  async hardDelete(id: string): Promise<void> {
    const file = await this.repository.findByIdIncludingDeleted(id);
    if (!file) throw new NotFoundException(`File ${id} not found`);

    await this.s3.delete(file.key);
    await this.repository.hardDelete(id);
  }
}
