import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class SoftDeleteFilesDto {
  @ApiProperty({
    description: 'Ids of the files to soft-delete.',
    type: [String],
    format: 'uuid',
    example: ['3f6c2b1e-2f2a-4d6e-9d1a-2b7c9e8f1234'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
