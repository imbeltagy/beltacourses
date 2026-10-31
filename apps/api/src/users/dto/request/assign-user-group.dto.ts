import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignUserGroupDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  group_id: string;
}
