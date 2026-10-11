import { DEFAULT_EMAIL_LOCALE, EMAIL_LOCALES } from './email.constants';
import type { EmailLocale } from './email.types';

/**
 * Picks the best shipped locale from an `Accept-Language` value, highest
 * `q` first, matching on the primary subtag (`ar-EG` → `ar`). An empty,
 * missing or unrecognised header gives `DEFAULT_EMAIL_LOCALE`.
 */
export function resolveEmailLocale(header: string | undefined): EmailLocale {
  const candidates = (header ?? '')
    .split(',')
    .map((part, index) => {
      const [range, ...params] = part.trim().split(';');
      const q = params
        .map((param) => /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(param)?.[1])
        .find((value) => value !== undefined);
      return {
        tag: (range ?? '').trim().toLowerCase().split('-')[0] ?? '',
        q: q === undefined ? 1 : Number(q),
        index,
      };
    })
    .filter((c) => c.tag !== '' && c.tag !== '*' && c.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  const match = candidates.find((c) =>
    (EMAIL_LOCALES as readonly string[]).includes(c.tag),
  );
  return (match?.tag as EmailLocale | undefined) ?? DEFAULT_EMAIL_LOCALE;
}
