import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Deliberately narrower than `CreateUserDto`: no role, no `confirmed`. A caller
 * who smuggles either is stripped by the global `ValidationPipe`'s whitelist,
 * and `AuthService` overrides both regardless.
 */
export class RegisterDto {
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
}
