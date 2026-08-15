import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'jane@example.com' })
  @IsEmail()
  email: string;

  /**
   * No `@MinLength` here on purpose. Restating the password policy on login
   * would let a caller distinguish "too short to be a real password" from
   * "wrong password", and it would lock out accounts whenever the policy
   * tightens.
   */
  @ApiProperty({ example: 'correct-horse-battery' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
