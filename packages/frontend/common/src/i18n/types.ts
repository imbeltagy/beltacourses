import type en from "./messages/en.json";
import type { Locale } from "./routing";

/**
 * Types `useTranslations` / `getTranslations` keys and `useLocale()` across
 * every package that imports from `@repo/frontend/i18n/*`. `en.json` is the
 * source of truth; `ar.json` is checked against it in `request.ts`.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}

export type Messages = typeof en;
