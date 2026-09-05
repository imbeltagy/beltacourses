import { RedisService } from '@repo/service/redis';

type SessionServiceCtor =
  typeof import('../../src/core/session.service').SessionService;

function loadSessionService(secret?: string): SessionServiceCtor {
  jest.resetModules();
  if (secret === undefined) delete process.env.REFRESH_TOKEN_HASH_SECRET;
  else process.env.REFRESH_TOKEN_HASH_SECRET = secret;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return require('../../src/core/session.service').SessionService;
}

describe('SessionService', () => {
  afterEach(() => {
    delete process.env.REFRESH_TOKEN_HASH_SECRET;
  });

  it('throws in the constructor without REFRESH_TOKEN_HASH_SECRET', () => {
    const SessionService = loadSessionService(undefined);
    const redis = { client: {} } as unknown as RedisService;

    expect(() => new SessionService(redis)).toThrow(
      'Missing required environment variables: REFRESH_TOKEN_HASH_SECRET',
    );
  });

  describe('with a valid secret', () => {
    let SessionService: SessionServiceCtor;
    let pipeline: {
      set: jest.Mock;
      sadd: jest.Mock;
      expire: jest.Mock;
      del: jest.Mock;
      srem: jest.Mock;
      exec: jest.Mock;
    };
    let redisClient: {
      pipeline: jest.Mock;
      get: jest.Mock;
      exists: jest.Mock;
      smembers: jest.Mock;
    };
    let redis: RedisService;

    beforeEach(() => {
      SessionService = loadSessionService('hash-secret');
      pipeline = {
        set: jest.fn().mockReturnThis(),
        sadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        srem: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      redisClient = {
        pipeline: jest.fn(() => pipeline),
        get: jest.fn(),
        exists: jest.fn(),
        smembers: jest.fn(),
      };
      redis = { client: redisClient } as unknown as RedisService;
    });

    it('saveSession writes the hash, never the raw token, with a 10h TTL and SADDs the sid', async () => {
      const service = new SessionService(redis);

      await service.saveSession('user-1', 'sid-1', 'the-raw-refresh-token');

      expect(pipeline.set).toHaveBeenCalledWith(
        'session:user-1:sid-1',
        expect.any(String),
        'EX',
        10 * 60 * 60,
      );
      const [, storedValue] = pipeline.set.mock.calls[0] as [
        string,
        string,
        string,
        number,
      ];
      expect(storedValue).not.toBe('the-raw-refresh-token');
      expect(pipeline.sadd).toHaveBeenCalledWith('sessions:user-1', 'sid-1');
      expect(pipeline.expire).toHaveBeenCalledWith(
        'sessions:user-1',
        10 * 60 * 60,
      );
    });

    it('getSession returns null on a miss', async () => {
      redisClient.get.mockResolvedValue(null);
      const service = new SessionService(redis);

      await expect(service.getSession('user-1', 'sid-1')).resolves.toBeNull();
    });

    it('hasSession maps EXISTS 1/0 to true/false', async () => {
      const service = new SessionService(redis);

      redisClient.exists.mockResolvedValue(1);
      await expect(service.hasSession('user-1', 'sid-1')).resolves.toBe(true);

      redisClient.exists.mockResolvedValue(0);
      await expect(service.hasSession('user-1', 'sid-1')).resolves.toBe(false);
    });

    it('verifySession is true for the right token', async () => {
      const service = new SessionService(redis);
      await service.saveSession('user-1', 'sid-1', 'the-raw-refresh-token');
      const storedHash = pipeline.set.mock.calls[0][1] as string;
      redisClient.get.mockResolvedValue(storedHash);

      await expect(
        service.verifySession('user-1', 'sid-1', 'the-raw-refresh-token'),
      ).resolves.toBe(true);
    });

    it('verifySession is false for a different token', async () => {
      const service = new SessionService(redis);
      await service.saveSession('user-1', 'sid-1', 'the-raw-refresh-token');
      const storedHash = pipeline.set.mock.calls[0][1] as string;
      redisClient.get.mockResolvedValue(storedHash);

      await expect(
        service.verifySession('user-1', 'sid-1', 'a-different-token'),
      ).resolves.toBe(false);
    });

    it('verifySession is false on a miss', async () => {
      redisClient.get.mockResolvedValue(null);
      const service = new SessionService(redis);

      await expect(
        service.verifySession('user-1', 'sid-1', 'anything'),
      ).resolves.toBe(false);
    });

    it('removeSession DELs and SREMs', async () => {
      const service = new SessionService(redis);

      await service.removeSession('user-1', 'sid-1');

      expect(pipeline.del).toHaveBeenCalledWith('session:user-1:sid-1');
      expect(pipeline.srem).toHaveBeenCalledWith('sessions:user-1', 'sid-1');
    });

    it('removeAllUserSessions reads the index and deletes every entry plus the index', async () => {
      redisClient.smembers.mockResolvedValue(['sid-1', 'sid-2']);
      const service = new SessionService(redis);

      const count = await service.removeAllUserSessions('user-1');

      expect(pipeline.del).toHaveBeenCalledWith('session:user-1:sid-1');
      expect(pipeline.del).toHaveBeenCalledWith('session:user-1:sid-2');
      expect(pipeline.del).toHaveBeenCalledWith('sessions:user-1');
      expect(count).toBe(2);
    });

    it('removeAllUserSessions returns 0 for a user with no sessions', async () => {
      redisClient.smembers.mockResolvedValue([]);
      const service = new SessionService(redis);

      await expect(service.removeAllUserSessions('user-1')).resolves.toBe(0);
      expect(redisClient.pipeline).not.toHaveBeenCalled();
    });
  });
});
