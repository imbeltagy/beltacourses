import { NextIntlClientProvider } from "next-intl";
import { Direction } from "radix-ui";
import { getDirection } from "../../i18n/routing";

/**
 * Hands the current locale's messages to client components, and tells Radix
 * which way is "start" — without it, dropdowns, selects and tooltips position
 * themselves for LTR even when the page is RTL.
 *
 * Server component: `NextIntlClientProvider` inherits locale and messages from
 * the request config, so nothing is passed in.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider>
      <Direction.Provider dir={getDirection(locale)}>
        {children}
      </Direction.Provider>
    </NextIntlClientProvider>
  );
}
