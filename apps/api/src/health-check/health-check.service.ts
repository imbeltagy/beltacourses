import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/service/prisma';
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from './health-check.constants';
import { HealthStatus, ServiceStatus } from './health-check.types';

@Injectable()
export class HealthCheckService {
  constructor(private readonly prisma: PrismaService) {}

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
    const redis = new Redis({
      host: REDIS_HOST ?? 'localhost',
      port: Number(REDIS_PORT ?? 6379),
      lazyConnect: true,
      retryStrategy: () => null,
      maxRetriesPerRequest: 1,
    });

    try {
      await redis.connect();
      await redis.ping();
      return 'running';
    } catch {
      return 'down';
    } finally {
      redis.disconnect();
    }
  }
}
