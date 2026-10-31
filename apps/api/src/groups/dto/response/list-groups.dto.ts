import { ApiProperty } from '@nestjs/swagger';
import {
  ListResponseDto,
  PaginationMetadataDto,
} from '@repo/backend/pagination';
import { Expose, Type } from 'class-transformer';
import { GroupResponseDto } from './group.dto';

export class ListGroupsResponseDto implements ListResponseDto<GroupResponseDto> {
  @ApiProperty({ type: [GroupResponseDto] })
  @Expose()
  @Type(() => GroupResponseDto)
  data: GroupResponseDto[];

  @ApiProperty({ type: PaginationMetadataDto })
  @Expose()
  @Type(() => PaginationMetadataDto)
  meta: PaginationMetadataDto;
}
