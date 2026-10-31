import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@repo/db';
import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'student@beltacourses.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @Expose()
  name: string;

  @ApiProperty({ enum: Role })
  @Expose()
  role: Role;

  @ApiProperty()
  @Expose()
  confirmed: boolean;

  @ApiProperty({ nullable: true, type: String })
  @Expose()
  bio: string | null;

  @ApiProperty({ enum: Gender, nullable: true, type: String })
  @Expose()
  gender: Gender | null;

  @ApiProperty({ nullable: true, type: String, format: 'date' })
  @Expose()
  date_of_birth: Date | null;

  @ApiProperty({ nullable: true, type: () => UserAvatarDto })
  @Expose()
  @Type(() => UserAvatarDto)
  avatar: UserAvatarDto | null;

  @ApiProperty({
    nullable: true,
    type: () => UserGroupDto,
    description: 'Only an admin ever has one.',
  })
  @Expose()
  @Type(() => UserGroupDto)
  group: UserGroupDto | null;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  updated_at: Date;
}

class UserAvatarDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ format: 'uri' })
  @Expose()
  url: string;
}

class UserGroupDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Support' })
  @Expose()
  name: string;
}
