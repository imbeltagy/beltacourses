import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  // The locale is always in the URL (`/en/login`, `/ar/login`), so a link is
  // never ambiguous and a shared URL always renders in the sender's language.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return (routing.locales as readonly string[]).includes(value ?? "");
}

const RTL_LOCALES: readonly Locale[] = ["ar"];

export type Direction = "ltr" | "rtl";

export function getDirection(locale: string): Direction {
  return RTL_LOCALES.includes(locale as Locale) ? "rtl" : "ltr";
}
