import type { PasswordService as PasswordServiceType } from '../../src/users/password.service';

type PasswordServiceModule = typeof import('../../src/users/password.service');

/**
 * `users.constants.ts` reads `process.env` at import time, so every case has to
 * re-import the module after setting the variable. `require` rather than
 * `import()`, which ts-jest leaves as a real ESM dynamic import.
 */
const load = (value: string | undefined): PasswordServiceType => {
  jest.resetModules();

  if (value === undefined) delete process.env.PASSWORD_SALT_ROUNDS;
  else process.env.PASSWORD_SALT_ROUNDS = value;

  const { PasswordService } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../src/users/password.service') as PasswordServiceModule;

  return new PasswordService();
};

describe('PasswordService', () => {
  const original = process.env.PASSWORD_SALT_ROUNDS;

  afterAll(() => {
    if (original === undefined) delete process.env.PASSWORD_SALT_ROUNDS;
    else process.env.PASSWORD_SALT_ROUNDS = original;
  });

  describe('hash', () => {
    it('never returns the plain text and verifies through compare', async () => {
      const service = load('4');

      const hashed = await service.hash('correct horse battery');

      expect(hashed).not.toBe('correct horse battery');
      expect(hashed).toMatch(/^\$2[aby]\$/);
      await expect(
        service.compare('correct horse battery', hashed),
      ).resolves.toBe(true);
    });

    it('salts, so the same password hashes differently every time', async () => {
      const service = load('4');

      const [first, second] = await Promise.all([
        service.hash('same-password'),
        service.hash('same-password'),
      ]);

      expect(first).not.toBe(second);
    });
  });

  describe('compare', () => {
    it('rejects a wrong password', async () => {
      const service = load('4');
      const hashed = await service.hash('right');

      await expect(service.compare('wrong', hashed)).resolves.toBe(false);
    });
  });

  describe('PASSWORD_SALT_ROUNDS', () => {
    it.each([undefined, ''])('falls back to the default for %p', (value) => {
      expect(() => load(value)).not.toThrow();
    });

    it.each(['not-a-number', '3', '16', '10.5'])(
      'throws in the constructor for %p',
      (value) => {
        expect(() => load(value)).toThrow('PASSWORD_SALT_ROUNDS');
      },
    );
  });
});
