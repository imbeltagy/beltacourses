import { ApiProperty } from '@nestjs/swagger';
import type { PublicGroup } from '../../groups.types';

export class GroupResponse implements PublicGroup {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Support' })
  name: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ type: [String], example: ['users:*'] })
  permissions: string[];

  @ApiProperty({ example: 3 })
  users_count: number;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}
