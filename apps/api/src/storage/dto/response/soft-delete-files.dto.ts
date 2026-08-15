import { ApiProperty } from '@nestjs/swagger';

export class SoftDeleteFilesResponse {
  @ApiProperty({
    description:
      'Ids that actually transitioned to deleted. Ids that were unknown or already deleted are absent — diff against what you sent.',
    type: [String],
    format: 'uuid',
  })
  deleted: string[];
}
