import path from 'node:path';

// Same variables, and the same Gmail account, as the previous backend.
export const NODEMAILER_USER = process.env.NODEMAILER_USER;
export const NODEMAILER_PASS = process.env.NODEMAILER_PASS;
export const NODEMAILER_SENDER_EMAIL = process.env.NODEMAILER_SENDER_EMAIL;

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
