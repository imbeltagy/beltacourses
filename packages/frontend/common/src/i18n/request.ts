import { getRequestConfig } from "next-intl/server";
import ar from "./messages/ar.json";
import en from "./messages/en.json";
import { isLocale, routing, type Locale } from "./routing";
import type { Messages } from "./types";

// `satisfies` is what makes a key missing from either file a compile error.
const messages = { en, ar } satisfies Record<Locale, Messages>;

/**
 * Wired in by each app's `next.config.ts` via `createNextIntlPlugin`. Lives
 * here, not in the apps, so there is one place that decides what a locale is.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
    // Pinned so dates render identically on the server and in the browser;
    // otherwise each side uses its own zone and React reports a mismatch.
    timeZone: "UTC",
  };
});
