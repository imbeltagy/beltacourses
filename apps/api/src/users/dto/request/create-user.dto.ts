import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender, Role } from '@repo/db';
import { ASSIGNABLE_ROLES } from '../../users.constants';
import { ToBoolean } from '../transforms';

/**
 * Sent as `multipart/form-data`, so an avatar can be uploaded in the same
 * request as the rest of the profile. Every field therefore arrives as a
 * string — see the transforms on the non-string ones.
 */
export class CreateUserDto {
  @ApiProperty({ format: 'email', example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    description: 'Capped at 72 bytes — bcrypt silently truncates past that.',
    example: 'correct-horse-battery',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    enum: ASSIGNABLE_ROLES,
    default: Role.student,
    description:
      'Any role except super_admin, which is never created over HTTP. This is ' +
      'the only place a role can be set — it is immutable afterwards.',
  })
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES, {
    message: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
  })
  role?: Role;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ format: 'date', example: '1990-05-17' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Profile picture, uploaded with the request. Mutually exclusive with ' +
      'avatar_id. Bound by the file interceptor, not by validation — a text ' +
      'field of this name is discarded.',
  })
  avatar?: unknown;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Id of an already-uploaded file, for a client that used POST /storage ' +
      'first. Must not be soft-deleted. Mutually exclusive with avatar.',
  })
  @IsOptional()
  @IsUUID()
  avatar_id?: string;
}
