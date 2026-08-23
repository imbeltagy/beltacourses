import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@repo/service/health-check';

@Controller('/health-check')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  getStatus(): string {
    return this.healthCheckService.getStatus();
  }
}
