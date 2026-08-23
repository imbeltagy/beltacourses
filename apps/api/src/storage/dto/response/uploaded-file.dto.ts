import { ApiProperty } from '@nestjs/swagger';
import type { UploadedFile } from '../../storage.types';

export class UploadedFileResponse implements UploadedFile {
  @ApiProperty({
    description:
      'Id of the file metadata row. Reference files by this everywhere.',
    example: '3f6c2b1e-2f2a-4d6e-9d1a-2b7c9e8f1234',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Public URL of the stored object.',
    example:
      'https://my-bucket.s3.eu-central-1.amazonaws.com/2026/08/3f6c2b1e-....png',
  })
  url: string;
}
