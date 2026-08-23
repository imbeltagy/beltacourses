import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({
    description: 'Bearer access token. Does not expire.',
    example: 'eyJzdWIiOiI...In0.k3f9...',
  })
  access_token: string;
}
