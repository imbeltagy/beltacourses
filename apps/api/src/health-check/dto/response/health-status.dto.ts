import { ApiProperty } from '@nestjs/swagger';
import type { HealthStatus, ServiceStatus } from '../../health-check.types';

export class HealthStatusResponseDto implements HealthStatus {
  @ApiProperty({ enum: ['running', 'down'], example: 'running' })
  postgres: ServiceStatus;

  @ApiProperty({ enum: ['running', 'down'], example: 'running' })
  redis: ServiceStatus;
}
