import { ApiPropertyOptional } from '@nestjs/swagger';
import { ALL_PERMISSIONS, type Permission } from '@repo/service/core';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Sending `permissions` replaces the whole set — never a merge. */
export class UpdateGroupDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: [...ALL_PERMISSIONS] as string[],
    description:
      'Every value must be a permission from the hardcoded catalog. Replaces the whole set.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALL_PERMISSIONS, { each: true })
  permissions?: Permission[];
}
