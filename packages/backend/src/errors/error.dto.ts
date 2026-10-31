import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ErrorBody } from './error-body.types';
import { ErrorCode } from './error-code';

/** Body of every non-2xx response. Produced by `AppExceptionFilter`. */
export class ErrorResponseDto implements ErrorBody {
  @ApiProperty({ example: 409, description: 'The HTTP status.' })
  code!: number;

  @ApiProperty({
    enum: ErrorCode,
    enumName: 'ErrorCode',
    example: ErrorCode.EMAIL_ALREADY_EXISTS,
    description: 'Stable value clients switch on and localize.',
  })
  error!: ErrorCode;

  @ApiPropertyOptional({
    description: 'English detail for logs. Clients must not show it to users.',
  })
  message?: string;
}
