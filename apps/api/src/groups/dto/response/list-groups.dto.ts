import { ApiProperty } from '@nestjs/swagger';
import type { ListGroupsResult } from '../../groups.types';
import { GroupResponse } from './group.dto';

export class ListGroupsResponse implements ListGroupsResult {
  @ApiProperty({ type: [GroupResponse] })
  items: GroupResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
