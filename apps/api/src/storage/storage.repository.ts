import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/service/prisma';
import { FileMetadata } from '@repo/db';

export interface CreateFileData {
  key: string;
  url: string;
  name: string;
  size: number;
  mime_type: string;
  bucket: string;
}

@Injectable()
export class StorageRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFileData): Promise<FileMetadata> {
    return this.prisma.client.fileMetadata.create({ data });
  }

  findById(id: string): Promise<FileMetadata | null> {
    return this.prisma.client.fileMetadata.findFirst({
      where: { id, deleted_at: null },
    });
  }

  findByIdIncludingDeleted(id: string): Promise<FileMetadata | null> {
    return this.prisma.client.fileMetadata.findUnique({ where: { id } });
  }

  async softDelete(id: string): Promise<number> {
    const result = await this.prisma.client.fileMetadata.updateMany({
      where: { id, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    return result.count;
  }

  softDeleteMany(ids: string[]): Promise<FileMetadata[]> {
    return this.prisma.client.fileMetadata.updateManyAndReturn({
      where: { id: { in: ids }, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  /** Removes the row. Does NOT touch S3. */
  async hardDelete(id: string): Promise<void> {
    await this.prisma.client.fileMetadata.delete({ where: { id } });
  }

  findSoftDeleted({
    take,
    skip,
  }: {
    take: number;
    skip: number;
  }): Promise<FileMetadata[]> {
    return this.prisma.client.fileMetadata.findMany({
      where: { deleted_at: { not: null } },
      orderBy: { deleted_at: 'asc' },
      take,
      skip,
    });
  }
}
