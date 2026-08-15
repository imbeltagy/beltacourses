import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@repo/db';
import type { PublicUser } from '../../users.types';

/**
 * `implements PublicUser` on purpose: the compiler then catches any drift
 * between the documented shape and what the service actually returns — including
 * a field added to the model and forgotten here.
 */
export class UserResponse implements PublicUser {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email', example: 'jane@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ enum: Role, example: Role.student })
  role: Role;

  @ApiProperty({
    description: 'Whether the email address has been confirmed.',
    example: false,
  })
  confirmed: boolean;

  @ApiProperty({ nullable: true, type: String, example: null })
  bio: string | null;

  @ApiProperty({ enum: Gender, nullable: true, example: null })
  gender: Gender | null;

  @ApiProperty({
    nullable: true,
    type: String,
    format: 'date',
    example: null,
  })
  date_of_birth: Date | null;

  @ApiProperty({
    description: 'Id of the profile picture in the storage service.',
    nullable: true,
    type: String,
    format: 'uuid',
    example: null,
  })
  avatar_id: string | null;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;

  @ApiProperty({ format: 'date-time' })
  updated_at: Date;
}
