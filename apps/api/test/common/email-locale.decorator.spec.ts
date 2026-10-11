import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { EmailLocaleParam } from '../../src/common/decorators/email-locale.decorator';

class Host {
  handler(@EmailLocaleParam() _locale: string) {}
}

function resolve(header: string | undefined) {
  const meta = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Host,
    'handler',
  ) as Record<string, { factory: (data: unknown, ctx: unknown) => string }>;
  const entry = Object.values(meta)[0];
  if (!entry) throw new Error('decorator not registered');
  const ctx = {
    switchToHttp: () => ({ getRequest: () => ({ header: () => header }) }),
  };
  return entry.factory(undefined, ctx);
}

describe('EmailLocaleParam', () => {
  it.each([
    ['ar-EG,ar;q=0.9', 'ar'],
    ['en-US', 'en'],
    ['fr', 'en'],
    ['', 'en'],
    [undefined, 'en'],
  ])('%j → %s', (header, expected) => {
    expect(resolve(header)).toBe(expected);
  });
});
