import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { PrismaModule } from '@repo/service/prisma';
import { RedisModule } from '@repo/service/redis';
import { HealthCheckModule } from './health-check/health-check.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    HealthCheckModule,
    StorageModule,
    UsersModule,
    AuthModule,
    GroupsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
