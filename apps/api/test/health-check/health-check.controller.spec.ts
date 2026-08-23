import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from '../../src/health-check/health-check.controller';
import { HealthCheckService } from '../../src/health-check/health-check.service';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [HealthCheckService],
    }).compile();

    healthCheckController = app.get<HealthCheckController>(
      HealthCheckController,
    );
  });

  describe('root', () => {
    it('should return "Works Fine!"', () => {
      expect(healthCheckController.getStatus()).toBe('Works Fine!');
    });
  });
});
