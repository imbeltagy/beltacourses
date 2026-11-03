import { Role } from '@repo/db';
import type { SessionRepository } from '../../../src/iam/auth/session.repository';
import type { Session } from '../../../src/iam/types/iam.types';

type SessionServiceCtor =
  typeof import('../../../src/iam/auth/session.service').SessionService;

const client = (): Session => ({
  userId: 'user-1',
  role: Role.student,
  groupId: null,
  permissions: [],
  hashedRefreshToken: 'h',
});
const moderator = (): Session => ({ ...client(), role: Role.admin });

function load(secret?: string): SessionServiceCtor {
  jest.resetModules();
  if (secret === undefined) delete process.env.REFRESH_TOKEN_HASH_SECRET;
  else process.env.REFRESH_TOKEN_HASH_SECRET = secret;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return
  return require('../../../src/iam/auth/session.service').SessionService;
}

describe('SessionService', () => {
  let service: InstanceType<SessionServiceCtor>;
  let repository: {
    create: jest.Mock;
    get: jest.Mock;
    rotate: jest.Mock;
    remove: jest.Mock;
    removeAllForUser: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      rotate: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      removeAllForUser: jest.fn().mockResolvedValue(1),
    };
    const SessionService = load('hash-secret');
    service = new SessionService(repository as unknown as SessionRepository);
  });

  afterEach(() => {
    delete process.env.REFRESH_TOKEN_HASH_SECRET;
  });

  it('throws on construction without REFRESH_TOKEN_HASH_SECRET', () => {
    const SessionService = load(undefined);

    expect(
      () => new SessionService(repository as unknown as SessionRepository),
    ).toThrow('REFRESH_TOKEN_HASH_SECRET');
  });

  it('create uses the 7 d refresh TTL for a client', async () => {
    await service.create('sid-1', client());

    expect(repository.create).toHaveBeenCalledWith('sid-1', client(), 604800);
  });

  it('create uses the 10 h refresh TTL for a moderator', async () => {
    await service.create('sid-1', moderator());

    expect(repository.create).toHaveBeenCalledWith('sid-1', moderator(), 36000);
  });

  it('get returns the stored session', async () => {
    repository.get.mockResolvedValue(client());

    await expect(service.get('sid-1')).resolves.toEqual(client());
  });

  it('rotate passes the expected hash and the role TTL, and returns the CAS result', async () => {
    repository.rotate.mockResolvedValue(false);

    await expect(
      service.rotate('sid-1', 'old-hash', moderator()),
    ).resolves.toBe(false);
    expect(repository.rotate).toHaveBeenCalledWith(
      'sid-1',
      'old-hash',
      moderator(),
      36000,
    );
  });

  it('remove delegates', async () => {
    await service.remove('sid-1', 'user-1');

    expect(repository.remove).toHaveBeenCalledWith('sid-1', 'user-1');
  });

  it('removeAllForUsers revokes each user', async () => {
    await service.removeAllForUsers(['a', 'b']);

    expect(repository.removeAllForUser).toHaveBeenCalledWith('a');
    expect(repository.removeAllForUser).toHaveBeenCalledWith('b');
  });

  describe('hash / verifyHash', () => {
    it('is deterministic base64url HMAC, not the token itself', () => {
      const hash = service.hash('a-token');

      expect(hash).toBe(service.hash('a-token'));
      expect(hash).not.toContain('a-token');
      expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('tells apart tokens sharing a long prefix', () => {
      const prefix = 'x'.repeat(100);

      expect(service.hash(`${prefix}a`)).not.toBe(service.hash(`${prefix}b`));
    });

    it('verifyHash accepts the matching token and rejects others', () => {
      const hash = service.hash('a-token');

      expect(service.verifyHash('a-token', hash)).toBe(true);
      expect(service.verifyHash('other', hash)).toBe(false);
      expect(service.verifyHash('a-token', 'short')).toBe(false);
    });
  });
});
