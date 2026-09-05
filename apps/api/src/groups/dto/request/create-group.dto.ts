import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateGroupDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Support' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({
    type: [String],
    example: [...ALL_PERMISSIONS] as string[],
    description: 'Every value must be a permission from the hardcoded catalog.',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ALL_PERMISSIONS, { each: true })
  permissions: Permission[];
}
