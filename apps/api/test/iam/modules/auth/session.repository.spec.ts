import type { RedisService } from '@repo/backend/redis';
import { Role } from '@repo/db';
import { SessionRepository } from '../../../../src/iam/modules/auth/session.repository';
import type { Session } from '../../../../src/iam/types/session.types';

const SESSION: Session = {
  userId: 'user-1',
  role: Role.admin,
  groupId: 'group-1',
  permissions: ['users:read'],
  hashedRefreshToken: 'hash-1',
};

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let multi: {
    set: jest.Mock;
    sadd: jest.Mock;
    expire: jest.Mock;
    del: jest.Mock;
    srem: jest.Mock;
    exec: jest.Mock;
  };
  let client: {
    multi: jest.Mock;
    get: jest.Mock;
    smembers: jest.Mock;
    eval: jest.Mock;
  };

  beforeEach(() => {
    multi = {
      set: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      srem: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    client = {
      multi: jest.fn().mockReturnValue(multi),
      get: jest.fn(),
      smembers: jest.fn(),
      eval: jest.fn(),
    };
    repository = new SessionRepository({ client } as unknown as RedisService);
  });

  describe('create', () => {
    it('sets the session with a TTL and indexes the sid in one MULTI', async () => {
      await repository.create('sid-1', SESSION, 36000);

      expect(multi.set).toHaveBeenCalledWith(
        'session:sid-1',
        JSON.stringify(SESSION),
        'EX',
        36000,
      );
      expect(multi.sadd).toHaveBeenCalledWith('users-sessions:user-1', 'sid-1');
      expect(multi.expire).toHaveBeenCalledWith('users-sessions:user-1', 36000);
      expect(multi.exec).toHaveBeenCalledTimes(1);
    });

    it('throws when a command in the transaction failed', async () => {
      multi.exec.mockResolvedValue([[new Error('OOM'), null]]);

      await expect(repository.create('sid-1', SESSION, 60)).rejects.toThrow(
        'OOM',
      );
    });
  });

  describe('get', () => {
    it('parses the stored JSON', async () => {
      client.get.mockResolvedValue(JSON.stringify(SESSION));

      await expect(repository.get('sid-1')).resolves.toEqual(SESSION);
      expect(client.get).toHaveBeenCalledWith('session:sid-1');
    });

    it('returns null for a missing key', async () => {
      client.get.mockResolvedValue(null);

      await expect(repository.get('sid-1')).resolves.toBeNull();
    });

    it('returns null for corrupt JSON', async () => {
      client.get.mockResolvedValue('{not json');

      await expect(repository.get('sid-1')).resolves.toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes the key and de-indexes the sid', async () => {
      await repository.remove('sid-1', 'user-1');

      expect(multi.del).toHaveBeenCalledWith('session:sid-1');
      expect(multi.srem).toHaveBeenCalledWith('users-sessions:user-1', 'sid-1');
      expect(multi.exec).toHaveBeenCalled();
    });
  });

  describe('removeAllForUser', () => {
    it('deletes every indexed session and the index', async () => {
      client.smembers.mockResolvedValue(['sid-1', 'sid-2']);

      await expect(repository.removeAllForUser('user-1')).resolves.toBe(2);

      expect(multi.del).toHaveBeenCalledWith('session:sid-1');
      expect(multi.del).toHaveBeenCalledWith('session:sid-2');
      expect(multi.del).toHaveBeenCalledWith('users-sessions:user-1');
    });

    it('does nothing for a user with no sessions', async () => {
      client.smembers.mockResolvedValue([]);

      await expect(repository.removeAllForUser('user-1')).resolves.toBe(0);
      expect(client.multi).not.toHaveBeenCalled();
    });
  });

  describe('rotate', () => {
    it('runs the compare-and-swap script with the expected hash and new session', async () => {
      client.eval.mockResolvedValue(1);

      await expect(
        repository.rotate('sid-1', 'hash-1', SESSION, 600),
      ).resolves.toBe(true);

      expect(client.eval).toHaveBeenCalledWith(
        expect.stringContaining('hashedRefreshToken'),
        2,
        'session:sid-1',
        'users-sessions:user-1',
        'hash-1',
        JSON.stringify(SESSION),
        600,
        'sid-1',
      );
    });

    it('returns false when the script refuses the swap', async () => {
      client.eval.mockResolvedValue(0);

      await expect(
        repository.rotate('sid-1', 'stale', SESSION, 600),
      ).resolves.toBe(false);
    });
  });
});
