import { ApiProperty } from '@nestjs/swagger';
import { UploadedFileResponse } from './uploaded-file.dto';
import { FileMetadata } from '@repo/db';

export class FileMetadataResponse
  extends UploadedFileResponse
  implements FileMetadata
{
  @ApiProperty({
    description: 'S3 object key.',
    example: '2026/08/3f6c2b1e-....png',
  })
  key: string;

  @ApiProperty({
    description: 'metadata of the uploaded file',
    example: 'invoice.pdf',
  })
  name: string;

  @ApiProperty({ description: 'Size in bytes.', example: 184320 })
  size: number;

  @ApiProperty({
    description: 'metadata of the uploaded file',
    example: 'application/pdf',
  })
  mime_type: string;

  @ApiProperty({
    description: 'Bucket holding the object.',
    example: 'my-bucket',
  })
  bucket: string;

  @ApiProperty({
    format: 'date-time',
  })
  created_at: Date;

  @ApiProperty({
    description:
      'Soft-delete timestamp. Always null here — deleted files return 404.',
    nullable: true,
    type: String,
    format: 'date-time',
    example: null,
  })
  deleted_at: Date | null;
}
