import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh tokens rotate: the one presented to `POST /auth/refresh` is spent,
 * and the response carries its replacement (same session).
 */
export class RefreshResponseDto {
  @ApiProperty({
    description:
      'Bearer access token. 30 min for clients, 5 min for moderators.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  access_token: string;

  @ApiProperty({
    description:
      'The new refresh token; the one just used no longer works. 7 d for clients, 10 h for moderators.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  refresh_token: string;

  @ApiProperty({ example: 'Bearer' })
  token_type: 'Bearer';

  @ApiProperty({
    description: 'Access token lifetime in seconds.',
    example: 1800,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Refresh token lifetime in seconds.',
    example: 604800,
  })
  refresh_expires_in: number;
}
