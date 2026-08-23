import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Role } from '@repo/db';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ASSIGNABLE_ROLES } from '../../users.constants';
import { blankToUndefined, toBoolean } from '@repo/service/core';

export class CreateUserDto {
  @ApiProperty({ example: 'student@beltacourses.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'correcthorse' })
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
    type: 'string',
    format: 'binary',
    description: 'Optional avatar image file.',
  })
  @IsOptional()
  @IsString()
  avatar?: Express.Multer.File;

  @ApiPropertyOptional({ enum: ASSIGNABLE_ROLES, default: Role.student })
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role: Role = Role.student;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  confirmed: boolean = false;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsIn(Object.values(Gender))
  gender?: Gender;

  @ApiPropertyOptional({ example: '1995-06-20', format: 'date' })
  @IsOptional()
  @Transform(blankToUndefined)
  @IsDateString()
  date_of_birth?: string;
}
