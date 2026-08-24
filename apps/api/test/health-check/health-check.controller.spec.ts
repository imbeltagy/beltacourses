import { ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckController } from '../../src/health-check/health-check.controller';
import { HealthCheckService } from '../../src/health-check/health-check.service';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let service: { getStatus: jest.Mock };

  beforeEach(() => {
    service = { getStatus: jest.fn() };
    controller = new HealthCheckController(
      service as unknown as HealthCheckService,
    );
  });

  it('returns the status object when both services are running', async () => {
    service.getStatus.mockResolvedValue({
      postgres: 'running',
      redis: 'running',
    });

    await expect(controller.getStatus()).resolves.toEqual({
      postgres: 'running',
      redis: 'running',
    });
  });

  it('throws ServiceUnavailableException when postgres is down', async () => {
    service.getStatus.mockResolvedValue({ postgres: 'down', redis: 'running' });

    await expect(controller.getStatus()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws ServiceUnavailableException when redis is down', async () => {
    service.getStatus.mockResolvedValue({ postgres: 'running', redis: 'down' });

    await expect(controller.getStatus()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
