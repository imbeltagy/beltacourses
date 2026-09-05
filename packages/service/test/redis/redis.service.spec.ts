const redisInstance = {
  on: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => redisInstance),
}));

import { RedisService } from '../../src/redis/redis.service';

describe('RedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ping', () => {
    it('returns true on a pong', async () => {
      redisInstance.ping.mockResolvedValue('PONG');
      const service = new RedisService();

      await expect(service.ping()).resolves.toBe(true);
    });

    it('returns false when the client throws', async () => {
      redisInstance.ping.mockRejectedValue(new Error('ECONNREFUSED'));
      const service = new RedisService();

      await expect(service.ping()).resolves.toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('calls quit on the client', async () => {
      redisInstance.quit.mockResolvedValue(undefined);
      const service = new RedisService();

      await service.onModuleDestroy();

      expect(redisInstance.quit).toHaveBeenCalledTimes(1);
    });
  });
});
