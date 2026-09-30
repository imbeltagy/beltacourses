import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from './redis.constants';

/**
 * The one shared Redis connection for the app. BullMQ keeps its own separate
 * connection pool on purpose (blocking commands must not share a client) —
 * see `nestjs-module.md`.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = new Redis({
      host: REDIS_HOST ?? 'localhost',
      port: Number(REDIS_PORT ?? 6379),
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (error) =>
      this.logger.error(`Redis error: ${error.message}`),
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
