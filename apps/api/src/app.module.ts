import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { HealthCheckController } from './health-check.controller';
import { PrismaModule } from '@repo/service/prisma';
import { HealthCheckService } from '@repo/service/health-check';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    PrismaModule,
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
    StorageModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export class AppModule {}
