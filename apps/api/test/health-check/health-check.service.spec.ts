import { PrismaService } from '@repo/service/prisma';
import { HealthCheckService } from '../../src/health-check/health-check.service';

const redisInstance = {
  connect: jest.fn(),
  ping: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => redisInstance),
}));

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let prisma: { client: { $queryRaw: jest.Mock } };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { client: { $queryRaw: jest.fn() } };
    service = new HealthCheckService(prisma as unknown as PrismaService);
  });

  it('reports both services as running when reachable', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redisInstance.connect.mockResolvedValue(undefined);
    redisInstance.ping.mockResolvedValue('PONG');

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'running',
      redis: 'running',
    });
  });

  it('reports postgres as down when the query fails', async () => {
    prisma.client.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redisInstance.connect.mockResolvedValue(undefined);
    redisInstance.ping.mockResolvedValue('PONG');

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'down',
      redis: 'running',
    });
  });

  it('reports redis as down when the connection fails', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redisInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'running',
      redis: 'down',
    });
  });

  it('always disconnects the redis client', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redisInstance.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    await service.getStatus();

    expect(redisInstance.disconnect).toHaveBeenCalledTimes(1);
  });
});
