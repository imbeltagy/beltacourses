import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { Gender, Role } from '@repo/db';

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
    enum: Role,
    default: Role.student,
    description:
      'Privileged field — the public register endpoint cannot set it.',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
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
    format: 'uuid',
    description: 'Id of an already-uploaded file. Must not be soft-deleted.',
  })
  @IsOptional()
  @IsUUID()
  avatar_id?: string;
}
