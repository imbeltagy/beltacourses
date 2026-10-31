import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { PaginationMetadata } from './pagination.types';

export class PaginationMetadataDto implements PaginationMetadata {
  @ApiProperty({ description: 'Total rows across every page.', example: 42 })
  @Expose()
  total: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @Expose()
  limit: number;
}
