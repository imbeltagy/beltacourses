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
import { Gender, Role } from '@repo/db';

/**
 * Declared field by field rather than derived from `CreateUserDto`:
 * `PartialType` would re-expose `password` (changing it needs the current one,
 * so it has its own flow), and it applies `@IsOptional()` everywhere, which
 * also lets `null` through for columns that are not nullable.
 *
 * Hence the two shapes below:
 * - `@ValidateIf(isPresent)` — optional, but `null` is a validation error.
 * - `@IsOptional()` — optional, and `null` explicitly clears the value.
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

  @ApiPropertyOptional({ enum: Role })
  @ValidateIf(isPresent)
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @ValidateIf(isPresent)
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiPropertyOptional({
    format: 'date',
    nullable: true,
    example: '1990-05-17',
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Send null to remove the avatar.',
  })
  @IsOptional()
  @IsUUID()
  avatar_id?: string | null;
}
