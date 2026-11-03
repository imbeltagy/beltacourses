import { ApiProperty } from '@nestjs/swagger';
import {
  ListResponseDto,
  PaginationMetadataDto,
} from '@repo/backend/pagination';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user.dto';

export class ListUsersResponseDto implements ListResponseDto<UserResponseDto> {
  @ApiProperty({ type: [UserResponseDto] })
  @Expose()
  @Type(() => UserResponseDto)
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMetadataDto })
  @Expose()
  @Type(() => PaginationMetadataDto)
  meta: PaginationMetadataDto;
}
