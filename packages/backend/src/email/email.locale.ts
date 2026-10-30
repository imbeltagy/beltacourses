import { DEFAULT_EMAIL_LOCALE, EMAIL_LOCALES } from './email.constants';
import type { EmailLocale } from './email.types';

// Our design expoects the header to include the excact locale string we match for or at least starts with it.
export function resolveEmailLocale(header: string | undefined): EmailLocale {
  const match = EMAIL_LOCALES.find((locale) =>
    header?.trim().toLowerCase().startsWith(locale),
  );
  return match ?? DEFAULT_EMAIL_LOCALE;
}
