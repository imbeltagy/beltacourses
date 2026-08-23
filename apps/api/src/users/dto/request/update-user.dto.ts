import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@repo/db';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { blankToNull, toBoolean } from '@repo/service/core';

/**
 * Forms can't send JSON `null`, so a nullable field is cleared by sending it blank.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional avatar image file.',
  })
  @IsOptional()
  @IsString()
  avatar?: Express.Multer.File;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(blankToNull)
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ enum: Gender, nullable: true })
  @IsOptional()
  @Transform(blankToNull)
  @ValidateIf((_, value) => value !== null)
  @IsIn(Object.values(Gender))
  gender?: Gender | null;

  @ApiPropertyOptional({
    example: '1995-06-20',
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @Transform(blankToNull)
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  date_of_birth?: string | null;
}
