import path from 'node:path';
import { EmailLocale } from './email.types';

export const NODEMAILER_USER = process.env.NODEMAILER_USER;
export const NODEMAILER_PASS = process.env.NODEMAILER_PASS;
export const NODEMAILER_SENDER_EMAIL = process.env.NODEMAILER_SENDER_EMAIL;

// Where to find the html emails. Default is react-emails build output.
export const EMAIL_TEMPLATES_DIR =
  process.env.EMAIL_TEMPLATES_DIR ??
  path.resolve(process.cwd(), '../../packages/frontend/emails/dist');

/** Mirrors `LOCALES` in `@repo/frontend-emails`. */
export const EMAIL_LOCALES: EmailLocale[] = ['en', 'ar'] as const;

export const DEFAULT_EMAIL_LOCALE = 'en' as EmailLocale;
