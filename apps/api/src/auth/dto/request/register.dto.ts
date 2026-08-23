import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@repo/db';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { REGISTERABLE_ROLES } from '../../../users/users.constants';

export class RegisterDto {
  @ApiProperty({ example: 'student@beltacourses.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'a1234567' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: REGISTERABLE_ROLES })
  @IsIn(REGISTERABLE_ROLES)
  role: Role;
}
