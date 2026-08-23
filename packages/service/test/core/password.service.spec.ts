type PasswordServiceCtor =
  typeof import('../../src/core/password.service').PasswordService;

/**
 * `core.constants.ts` reads `process.env` at import time, so each scenario needs a
 * fresh module registry with the env already set before the first import.
 */
function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function loadPasswordService(env: {
  PASSWORD_SALT?: string;
  PASSWORD_SALT_ROUNDS?: string;
}): PasswordServiceCtor {
  jest.resetModules();
  setEnv('PASSWORD_SALT', env.PASSWORD_SALT);
  setEnv('PASSWORD_SALT_ROUNDS', env.PASSWORD_SALT_ROUNDS);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return require('../../src/core/password.service').PasswordService;
}

describe('PasswordService', () => {
  afterEach(() => {
    delete process.env.PASSWORD_SALT;
    delete process.env.PASSWORD_SALT_ROUNDS;
  });

  it('hashes a password to something other than the plaintext, verifiable via compare', async () => {
    const PasswordService = loadPasswordService({
      PASSWORD_SALT: 'test-salt',
      PASSWORD_SALT_ROUNDS: '4',
    });
    const service = new PasswordService();

    const hashed = await service.hash('correct horse battery staple');

    expect(hashed).not.toBe('correct horse battery staple');
    await expect(
      service.compare('correct horse battery staple', hashed),
    ).resolves.toBe(true);
    await expect(service.compare('wrong password', hashed)).resolves.toBe(
      false,
    );
  });

  it('falls back to 12 rounds when PASSWORD_SALT_ROUNDS is not set', () => {
    const PasswordService = loadPasswordService({ PASSWORD_SALT: 'test-salt' });

    expect(() => new PasswordService()).not.toThrow();
  });

  it('throws in the constructor when PASSWORD_SALT_ROUNDS is not an integer', () => {
    const PasswordService = loadPasswordService({
      PASSWORD_SALT: 'test-salt',
      PASSWORD_SALT_ROUNDS: 'not-a-number',
    });

    expect(() => new PasswordService()).toThrow();
  });

  it('throws in the constructor when PASSWORD_SALT_ROUNDS is out of range', () => {
    const PasswordService = loadPasswordService({
      PASSWORD_SALT: 'test-salt',
      PASSWORD_SALT_ROUNDS: '20',
    });

    expect(() => new PasswordService()).toThrow();
  });

  it('throws in the constructor when PASSWORD_SALT is missing', () => {
    const PasswordService = loadPasswordService({ PASSWORD_SALT_ROUNDS: '4' });

    expect(() => new PasswordService()).toThrow(
      'PASSWORD_SALT environment variable is required',
    );
  });
});
