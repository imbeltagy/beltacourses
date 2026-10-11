import path from 'node:path';

export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
export const EMAIL_FROM = process.env.EMAIL_FROM;

/**
 * Where `@repo/frontend-emails` writes its output. The default assumes the
 * process starts in `apps/<app>` (turbo and `pnpm --filter` both do); point it
 * elsewhere when the built HTML is shipped to a different path.
 */
export const EMAIL_TEMPLATES_DIR =
  process.env.EMAIL_TEMPLATES_DIR ??
  path.resolve(process.cwd(), '../../packages/frontend/emails/dist');

/** Mirrors `LOCALES` in `@repo/frontend-emails` — a new locale goes in both. */
export const EMAIL_LOCALES = ['en', 'ar'] as const;

/** Used when a request names no locale, or one we do not ship. */
export const DEFAULT_EMAIL_LOCALE =
  'en' satisfies (typeof EMAIL_LOCALES)[number];
