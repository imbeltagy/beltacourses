type TokenServiceCtor =
  typeof import('../../src/core/token.service').TokenService;

function loadTokenService(secret?: string): TokenServiceCtor {
  jest.resetModules();
  if (secret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = secret;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return require('../../src/core/token.service').TokenService;
}

describe('TokenService', () => {
  afterEach(() => {
    delete process.env.ACCESS_TOKEN_SECRET;
  });

  it('signs a token that verify() decodes back to the same user id', () => {
    const TokenService = loadTokenService('secret-a');
    const service = new TokenService();

    const token = service.sign('user-1');

    expect(service.verify(token)).toBe('user-1');
  });

  it('rejects a token signed with a different secret', () => {
    const signer = new (loadTokenService('secret-a'))();
    const token = signer.sign('user-1');

    const verifier = new (loadTokenService('secret-b'))();

    expect(() => verifier.verify(token)).toThrow('Invalid access token');
  });

  it('rejects a tampered payload', () => {
    const TokenService = loadTokenService('secret-a');
    const service = new TokenService();
    const [, signature] = service.sign('user-1').split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'someone-else' }),
    ).toString('base64url');

    expect(() => service.verify(`${forgedPayload}.${signature}`)).toThrow(
      'Invalid access token',
    );
  });

  it('rejects a malformed token', () => {
    const TokenService = loadTokenService('secret-a');
    const service = new TokenService();

    expect(() => service.verify('not-a-token')).toThrow('Invalid access token');
  });

  it('throws in the constructor when ACCESS_TOKEN_SECRET is missing', () => {
    const TokenService = loadTokenService(undefined);

    expect(() => new TokenService()).toThrow(
      'ACCESS_TOKEN_SECRET environment variable is required',
    );
  });
});
