import { resolveEmailLocale } from '../../src/email/email.locale';

describe('resolveEmailLocale', () => {
  it.each([
    [undefined, 'en'],
    ['', 'en'],
    ['fr-FR,de;q=0.8', 'en'],
    ['*', 'en'],
    ['ar', 'ar'],
    ['AR-EG', 'ar'],
    ['ar-EG,ar;q=0.9,en;q=0.8', 'ar'],
    ['en;q=0.5, ar;q=0.9', 'ar'],
    ['fr, ar;q=0.4', 'ar'],
    ['ar;q=0, en', 'en'],
    ['ar;q=0', 'en'],
    ['en-US,en;q=0.9,ar;q=0.9', 'en'],
    ['garbage;;;q=x,,', 'en'],
  ])('%j → %s', (header, expected) => {
    expect(resolveEmailLocale(header)).toBe(expected);
  });
});
