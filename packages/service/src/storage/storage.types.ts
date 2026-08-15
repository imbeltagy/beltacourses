import type { FileMetadata } from '@repo/db';

/** What an upload returns per file: the id and where to fetch it. */
export type UploadedFile = Pick<FileMetadata, 'id' | 'url'>;

/** A file as handed over by the caller. Framework-agnostic on purpose — the package
 *  must not depend on Express/Multer shapes leaking into its public API. */
export interface FileToUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
