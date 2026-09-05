import { Role } from '@repo/db';

type TokenServiceCtor = typeof import('../../src/core/token.service').TokenService;

const CLIENT_USER = {
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane Doe',
  role: Role.student,
};

const MODERATOR_USER = {
  id: 'admin-1',
  email: 'admin@beltacourses.com',
  name: 'Admin Doe',
  role: Role.admin,
};

function loadTokenService(env: {
  access?: string;
  refresh?: string;
}): TokenServiceCtor {
  jest.resetModules();
  if (env.access === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = env.access;
  if (env.refresh === undefined) delete process.env.REFRESH_TOKEN_SECRET;
  else process.env.REFRESH_TOKEN_SECRET = env.refresh;
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return require('../../src/core/token.service').TokenService;
}

describe('TokenService', () => {
  afterEach(() => {
    delete process.env.ACCESS_TOKEN_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;
  });

  it('throws naming both secrets when both are absent', () => {
    const TokenService = loadTokenService({});

    expect(() => new TokenService()).toThrow(
      'Missing required environment variables: ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET',
    );
  });

  it('throws naming only the missing secret', () => {
    const TokenService = loadTokenService({ access: 'access-secret' });

    expect(() => new TokenService()).toThrow(
      'Missing required environment variables: REFRESH_TOKEN_SECRET',
    );
  });

  it('round-trips an access token', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    const token = service.signAccessToken(CLIENT_USER);
    const claims = service.verifyAccessToken(token);

    expect(claims.sub).toBe(CLIENT_USER.id);
    expect(claims.email).toBe(CLIENT_USER.email);
    expect(claims.role).toBe(CLIENT_USER.role);
    expect(claims.typ).toBe('access');
  });

  it('round-trips a refresh token', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    const token = service.signRefreshToken(CLIENT_USER);
    const claims = service.verifyRefreshToken(token);

    expect(claims.sub).toBe(CLIENT_USER.id);
    expect(claims.typ).toBe('refresh');
  });

  it('rejects a refresh token presented to verifyAccessToken', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();
    const refreshToken = service.signRefreshToken(CLIENT_USER);

    expect(() => service.verifyAccessToken(refreshToken)).toThrow(
      'Invalid access token',
    );
  });

  it('rejects an access token presented to verifyRefreshToken', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();
    const accessToken = service.signAccessToken(CLIENT_USER);

    expect(() => service.verifyRefreshToken(accessToken)).toThrow(
      'Invalid refresh token',
    );
  });

  it('rejects a token signed with the wrong secret', () => {
    const signer = new (loadTokenService({
      access: 'access-secret-a',
      refresh: 'refresh-secret',
    }))();
    const token = signer.signAccessToken(CLIENT_USER);

    const verifier = new (loadTokenService({
      access: 'access-secret-b',
      refresh: 'refresh-secret',
    }))();

    expect(() => verifier.verifyAccessToken(token)).toThrow(
      'Invalid access token',
    );
  });

  it('gives an expired token the exact same message as a forged one', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    let expiredMessage = '';
    try {
      // A negative expiresIn signs an already-expired token.
      const jwt = new (require('@nestjs/jwt').JwtService)({
        secret: 'access-secret',
      });
      const expiredToken = jwt.sign(
        { sub: 'x', email: 'x', name: 'x', role: Role.student, typ: 'access' },
        { expiresIn: -10 },
      );
      service.verifyAccessToken(expiredToken);
    } catch (error) {
      expiredMessage = (error as Error).message;
    }

    let forgedMessage = '';
    try {
      service.verifyAccessToken('not-a-token');
    } catch (error) {
      forgedMessage = (error as Error).message;
    }

    expect(expiredMessage).toBe('Invalid access token');
    expect(forgedMessage).toBe('Invalid access token');
    expect(expiredMessage).toBe(forgedMessage);
  });

  it('signs client and moderator TTLs into exp', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    const clientToken = service.signAccessToken(CLIENT_USER);
    const moderatorToken = service.signAccessToken(MODERATOR_USER);
    const clientClaims = service.verifyAccessToken(clientToken);
    const moderatorClaims = service.verifyAccessToken(moderatorToken);

    expect(clientClaims.exp - clientClaims.iat).toBe(30 * 60);
    expect(moderatorClaims.exp - moderatorClaims.iat).toBe(5 * 60);
  });

  it('includes sid only when passed', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    const withoutSid = service.verifyAccessToken(
      service.signAccessToken(MODERATOR_USER),
    );
    const withSid = service.verifyAccessToken(
      service.signAccessToken(MODERATOR_USER, 'sid-1'),
    );

    expect(withoutSid.sid).toBeUndefined();
    expect(withSid.sid).toBe('sid-1');
  });

  it('signPair returns Bearer and the role-correct expires_in', () => {
    const TokenService = loadTokenService({
      access: 'access-secret',
      refresh: 'refresh-secret',
    });
    const service = new TokenService();

    const clientPair = service.signPair(CLIENT_USER);
    const moderatorPair = service.signPair(MODERATOR_USER, 'sid-1');

    expect(clientPair.token_type).toBe('Bearer');
    expect(clientPair.expires_in).toBe(30 * 60);
    expect(moderatorPair.expires_in).toBe(5 * 60);
  });
});
