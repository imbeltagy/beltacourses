export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

const RTL_LOCALES: readonly Locale[] = ["ar"];

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
