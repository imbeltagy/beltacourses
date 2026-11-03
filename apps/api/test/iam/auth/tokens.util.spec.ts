import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import { errorWith } from '../../helpers/error-with';

type TokensUtilCtor =
  typeof import('../../../src/iam/auth/tokens.util').TokensUtil;

const ACCESS = 'access-secret';
const REFRESH = 'refresh-secret';
const DOMAIN = 'https://api.example.com';

const CLIENT = {
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane Doe',
  role: Role.student,
};
const MODERATOR = {
  id: 'admin-1',
  email: 'admin@beltacourses.com',
  name: 'Admin Doe',
  role: Role.admin,
};

/** constants read process.env at import time, so each scenario reloads the module. */
function load(env: {
  access?: string;
  refresh?: string;
  domain?: string;
}): TokensUtilCtor {
  jest.resetModules();
  const set = (key: string, value?: string) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  set('ACCESS_TOKEN_SECRET', env.access);
  set('REFRESH_TOKEN_SECRET', env.refresh);
  set('API_DOMAIN', env.domain);
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return
  return require('../../../src/iam/auth/tokens.util').TokensUtil;
}

describe('TokensUtil', () => {
  let tokens: InstanceType<TokensUtilCtor>;

  beforeEach(() => {
    const TokensUtil = load({
      access: ACCESS,
      refresh: REFRESH,
      domain: DOMAIN,
    });
    tokens = new TokensUtil();
  });

  afterEach(() => {
    delete process.env.ACCESS_TOKEN_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;
    delete process.env.API_DOMAIN;
  });

  describe('constructor', () => {
    it('names every missing variable in one error', () => {
      const TokensUtil = load({});

      expect(() => new TokensUtil()).toThrow(
        'Missing required environment variables: ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, API_DOMAIN',
      );
    });

    it('names only the missing one', () => {
      const TokensUtil = load({ access: ACCESS, refresh: REFRESH });

      expect(() => new TokensUtil()).toThrow(
        'Missing required environment variables: API_DOMAIN',
      );
    });

    it('does not throw on import', () => {
      expect(() => load({})).not.toThrow();
    });
  });

  describe('signPair', () => {
    it('signs a client pair with 30 min / 7 d lifetimes', () => {
      const pair = tokens.signPair(CLIENT, 'sid-1');

      expect(pair).toMatchObject({
        token_type: 'Bearer',
        expires_in: 1800,
        refresh_expires_in: 604800,
      });
    });

    it('signs a moderator pair with 5 min / 10 h lifetimes', () => {
      const pair = tokens.signPair(MODERATOR, 'sid-1');

      expect(pair).toMatchObject({
        expires_in: 300,
        refresh_expires_in: 36000,
      });
    });

    it('puts the documented claims and headers in the access token', () => {
      const { access_token } = tokens.signPair(CLIENT, 'sid-1');
      const decoded = new JwtService().decode(access_token, {
        complete: true,
      });

      expect(decoded.header).toEqual({ alg: 'HS256', typ: 'at+jwt' });
      expect(decoded.payload).toEqual({
        sub: 'user-1',
        sid: 'sid-1',
        role: Role.student,
        email: CLIENT.email,
        name: CLIENT.name,
        iss: `${DOMAIN}/auth/login`,
        aud: DOMAIN,
        iat: expect.any(Number) as number,
        exp: expect.any(Number) as number,
      });
    });

    it('puts the documented claims and headers in the refresh token', () => {
      const { refresh_token } = tokens.signPair(MODERATOR, 'sid-1');
      const decoded = new JwtService().decode(refresh_token, {
        complete: true,
      });

      expect(decoded.header).toEqual({ alg: 'HS256', typ: 'rt+jwt' });
      expect(decoded.payload).toEqual({
        sid: 'sid-1',
        userId: 'admin-1',
        iss: `${DOMAIN}/auth/moderators/login`,
        aud: DOMAIN,
        iat: expect.any(Number) as number,
        exp: expect.any(Number) as number,
      });
    });
  });

  describe('verifyAccess', () => {
    it('returns the claims of a valid token', () => {
      const { access_token } = tokens.signPair(MODERATOR, 'sid-1');

      expect(tokens.verifyAccess(access_token)).toMatchObject({
        sub: 'admin-1',
        sid: 'sid-1',
        role: Role.admin,
        iss: `${DOMAIN}/auth/moderators/login`,
      });
    });

    it('rejects a refresh token', () => {
      const { refresh_token } = tokens.signPair(CLIENT, 'sid-1');

      expect(() => tokens.verifyAccess(refresh_token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects garbage', () => {
      expect(() => tokens.verifyAccess('nope')).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects a token signed with another secret', () => {
      const forged = new JwtService({ secret: 'other' }).sign(
        { sub: 'u', sid: 's', role: Role.student },
        {
          header: { alg: 'HS256', typ: 'at+jwt' },
          issuer: `${DOMAIN}/auth/login`,
          audience: DOMAIN,
        },
      );

      expect(() => tokens.verifyAccess(forged)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    const forge = (
      header: Record<string, string>,
      claims: Record<string, unknown>,
      algorithm: 'HS256' | 'HS512' = 'HS256',
    ) =>
      new JwtService({ secret: ACCESS }).sign(
        { sub: 'u', sid: 's', role: Role.student, ...claims },
        { algorithm, header: { alg: algorithm, ...header } as never },
      );

    it('rejects another algorithm', () => {
      const token = forge(
        { typ: 'at+jwt' },
        { iss: `${DOMAIN}/auth/login`, aud: DOMAIN },
        'HS512',
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects the default typ JWT', () => {
      const token = forge({}, { iss: `${DOMAIN}/auth/login`, aud: DOMAIN });

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects a wrong audience', () => {
      const token = forge(
        { typ: 'at+jwt' },
        { iss: `${DOMAIN}/auth/login`, aud: 'https://evil' },
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects an unknown issuer', () => {
      const token = forge(
        { typ: 'at+jwt' },
        { iss: `${DOMAIN}/auth/other`, aud: DOMAIN },
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects a moderator role under the client issuer', () => {
      const token = forge(
        { typ: 'at+jwt' },
        { iss: `${DOMAIN}/auth/login`, aud: DOMAIN, role: Role.admin },
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects a client role under the moderators issuer', () => {
      const token = forge(
        { typ: 'at+jwt' },
        { iss: `${DOMAIN}/auth/moderators/login`, aud: DOMAIN },
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });

    it('rejects an expired token', () => {
      const token = forge(
        { typ: 'at+jwt' },
        {
          iss: `${DOMAIN}/auth/login`,
          aud: DOMAIN,
          exp: Math.floor(Date.now() / 1000) - 10,
        },
      );

      expect(() => tokens.verifyAccess(token)).toThrow(
        errorWith(ErrorCode.INVALID_ACCESS_TOKEN),
      );
    });
  });

  describe('verifyRefresh', () => {
    it('returns the claims of a valid token', () => {
      const { refresh_token } = tokens.signPair(CLIENT, 'sid-1');

      expect(tokens.verifyRefresh(refresh_token)).toMatchObject({
        sid: 'sid-1',
        userId: 'user-1',
        iss: `${DOMAIN}/auth/login`,
      });
    });

    it('rejects an access token', () => {
      const { access_token } = tokens.signPair(CLIENT, 'sid-1');

      expect(() => tokens.verifyRefresh(access_token)).toThrow(
        errorWith(ErrorCode.INVALID_REFRESH_TOKEN),
      );
    });

    it('rejects garbage', () => {
      expect(() => tokens.verifyRefresh('nope')).toThrow(
        errorWith(ErrorCode.INVALID_REFRESH_TOKEN),
      );
    });
  });

  describe('kindOfIssuer', () => {
    it('maps the two issuers and nothing else', () => {
      expect(tokens.kindOfIssuer(`${DOMAIN}/auth/login`)).toBe('client');
      expect(tokens.kindOfIssuer(`${DOMAIN}/auth/moderators/login`)).toBe(
        'moderator',
      );
      expect(tokens.kindOfIssuer('x')).toBeUndefined();
    });
  });
});
