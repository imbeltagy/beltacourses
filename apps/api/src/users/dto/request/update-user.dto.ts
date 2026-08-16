import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '@repo/db';
import { EmptyStringToNull, ToBoolean } from '../transforms';

/**
 * The multipart twin of `CreateUserDto`, with two fields deliberately absent:
 *
 * - **`password`** — changing one needs the current password, so it has its own
 *   flow. `PartialType(CreateUserDto)` would re-expose it.
 * - **`role`** — a role is chosen when the account is created and immutable
 *   afterwards. Promoting or demoting someone is a privileged act of its own,
 *   not a side effect of editing a profile.
 *
 * A form cannot send JSON `null`, so a field is cleared by sending it empty.
 * Hence the two shapes below:
 * - `@ValidateIf(isPresent)` — optional, but empty/`null` is a validation error.
 * - `@IsOptional()` + `@EmptyStringToNull()` — optional, and empty clears it.
 */
const isPresent = (_object: unknown, value: unknown) => value !== undefined;

export class UpdateUserDto {
  @ApiPropertyOptional({ format: 'email', example: 'jane@example.com' })
  @ValidateIf(isPresent)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 100, example: 'Jane Doe' })
  @ValidateIf(isPresent)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @ValidateIf(isPresent)
  @ToBoolean()
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({
    maxLength: 1000,
    nullable: true,
    description: 'Send empty to clear.',
  })
  @IsOptional()
  @EmptyStringToNull()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({
    enum: Gender,
    nullable: true,
    description: 'Send empty to clear.',
  })
  @IsOptional()
  @EmptyStringToNull()
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({
    format: 'date',
    nullable: true,
    example: '1990-05-17',
    description: 'Send empty to clear.',
  })
  @IsOptional()
  @EmptyStringToNull()
  @IsDateString()
  date_of_birth?: string | null;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Replacement profile picture, uploaded with the request. Mutually ' +
      'exclusive with avatar_id.',
  })
  avatar?: unknown;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Id of an already-uploaded file. Send empty to remove the avatar. ' +
      'Mutually exclusive with avatar.',
  })
  @IsOptional()
  @EmptyStringToNull()
  @IsUUID()
  avatar_id?: string | null;
}
