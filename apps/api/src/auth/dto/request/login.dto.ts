import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@beltacourses.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'a1234567' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
