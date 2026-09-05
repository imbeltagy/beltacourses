import { ApiProperty } from '@nestjs/swagger';

/**
 * No `refresh_token` here — there is no rotation (D5). The refresh token
 * presented to `POST /auth/refresh` stays valid for its full TTL.
 */
export class RefreshResponse {
  @ApiProperty({
    description:
      'Bearer access token. 30 min for clients, 5 min for moderators.',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  access_token: string;

  @ApiProperty({ example: 'Bearer' })
  token_type: 'Bearer';

  @ApiProperty({
    description: 'Access token lifetime in seconds.',
    example: 1800,
  })
  expires_in: number;
}
