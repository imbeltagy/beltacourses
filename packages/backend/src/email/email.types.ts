import type { EMAIL_LOCALES } from './email.constants';

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

/**
 * Every template and the `{{variables}}` its HTML and subject expect. A
 * template is added here and in `@repo/frontend-emails` — the compiler then
 * forces every caller to supply exactly these values.
 */
export interface EmailTemplates {
  'account-created': { name: string; email: string; loginUrl: string };
  'verify-email': {
    name: string;
    verifyUrl: string;
    expiresInMinutes: number;
  };
  'reset-password': {
    name: string;
    resetUrl: string;
    expiresInMinutes: number;
  };
  'login-notification': { name: string; time: string };
}

export type EmailTemplateName = keyof EmailTemplates;

export interface SendEmailInput<T extends EmailTemplateName> {
  to: string;
  /** Already resolved — use `resolveEmailLocale` on an `Accept-Language` value. */
  locale: EmailLocale;
  variables: EmailTemplates[T];
}

export interface RawEmail {
  to: string;
  subject: string;
  html: string;
}
