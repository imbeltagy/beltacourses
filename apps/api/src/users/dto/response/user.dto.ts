import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@repo/db';
import type { PublicUser } from '../../users.types';

export class UserResponse implements PublicUser {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'student@beltacourses.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  confirmed: boolean;

  @ApiProperty({ nullable: true, type: String })
  bio: string | null;

  @ApiProperty({ enum: Gender, nullable: true, type: String })
  gender: Gender | null;

  @ApiProperty({ nullable: true, type: String, format: 'date' })
  date_of_birth: Date | null;

  @ApiProperty({ nullable: true, type: () => UserResponseAvatar })
  avatar: UserResponseAvatar | null;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}

class UserResponseAvatar {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uri' })
  url: string;
}
