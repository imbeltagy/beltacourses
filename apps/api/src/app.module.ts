import { Module } from '@nestjs/common';
import { HealthCheckController } from './health-check.controller';
import { PrismaModule } from '@repo/service/prisma';
import { HealthCheckService } from '@repo/service/health-check';

@Module({
  imports: [PrismaModule],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export class AppModule {}
