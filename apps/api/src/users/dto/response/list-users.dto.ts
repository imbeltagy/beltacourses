import { ApiProperty } from '@nestjs/swagger';
import type { ListUsersResult } from '../../users.types';
import { UserResponse } from './user.dto';

export class ListUsersResponse implements ListUsersResult {
  @ApiProperty({ type: [UserResponse] })
  items: UserResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
