import { ApiProperty } from '@nestjs/swagger';

/**
 * `POST /auth/login` and `POST /auth/moderators/login` return the identical
 * schema, so both use this same class — a second class could not drift from
 * the first because both are produced by the same service method
 * (`AuthService`'s private `issueTokens`).
 */
export class LoginResponse {
  @ApiProperty({
    description:
      'Bearer access token. 30 min for clients, 5 min for moderators.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh token. 7 d for clients, 10 h for moderators.',
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
}
