import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/service/prisma';
import { RedisService } from '@repo/service/redis';
import { HealthStatus, ServiceStatus } from './health-check.types';

@Injectable()
export class HealthCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getStatus(): Promise<HealthStatus> {
    const [postgres, redis] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
    ]);
    return { postgres, redis };
  }

  private async checkPostgres(): Promise<ServiceStatus> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return 'running';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    return (await this.redis.ping()) ? 'running' : 'down';
  }
}
