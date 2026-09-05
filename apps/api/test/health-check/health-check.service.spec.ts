import { PrismaService } from '@repo/service/prisma';
import { RedisService } from '@repo/service/redis';
import { HealthCheckService } from '../../src/health-check/health-check.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let prisma: { client: { $queryRaw: jest.Mock } };
  let redis: { ping: jest.Mock };

  beforeEach(() => {
    prisma = { client: { $queryRaw: jest.fn() } };
    redis = { ping: jest.fn() };
    service = new HealthCheckService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  it('reports both services as running when reachable', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue(true);

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'running',
      redis: 'running',
    });
  });

  it('reports postgres as down when the query fails', async () => {
    prisma.client.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue(true);

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'down',
      redis: 'running',
    });
  });

  it('reports redis as down when ping() is false', async () => {
    prisma.client.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue(false);

    await expect(service.getStatus()).resolves.toEqual({
      postgres: 'running',
      redis: 'down',
    });
  });
});
