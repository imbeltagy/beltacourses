import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import type { GroupWithRelations } from '../../groups.types';

type Source = { obj: GroupWithRelations };

export class GroupResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Support' })
  @Expose()
  name: string;

  @ApiProperty({ nullable: true, type: String })
  @Expose()
  description: string | null;

  @ApiProperty({ type: [String], example: ['users:*'] })
  @Expose()
  @Transform(({ obj }: Source) => obj.permissions.map((p) => p.permission))
  permissions: string[];

  @ApiProperty({ example: 3 })
  @Expose()
  @Transform(({ obj }: Source) => obj._count.users)
  users_count: number;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  updated_at: Date;
}
