import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthStatusResponse } from './dto/response/health-status.dto';
import { HealthCheckService } from './health-check.service';

@ApiTags('health-check')
@Controller('/health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  @ApiOperation({ summary: 'Check Postgres and Redis connectivity' })
  @ApiOkResponse({ type: HealthStatusResponse })
  @ApiServiceUnavailableResponse({
    type: HealthStatusResponse,
    description: 'At least one dependency is unreachable.',
  })
  async getStatus(): Promise<HealthStatusResponse> {
    const status = await this.healthCheckService.getStatus();
    if (status.postgres === 'down' || status.redis === 'down') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
