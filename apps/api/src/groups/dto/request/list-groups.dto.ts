import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/backend/pagination';
import { IsOptional, IsString } from 'class-validator';

export class ListGroupsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Matches the group name, case-insensitive.',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
