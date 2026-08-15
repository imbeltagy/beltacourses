import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from './user.dto';
import type { ListUsersResult } from '../../users.types';

export class ListUsersResponse implements ListUsersResult {
  @ApiProperty({ type: [UserResponse] })
  items: UserResponse[];

  @ApiProperty({
    description: 'Total number of live users matching the filters.',
    example: 137,
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
