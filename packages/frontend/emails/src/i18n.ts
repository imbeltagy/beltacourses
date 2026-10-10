import type { Locale } from "./locales.ts";

export type Messages = { [key: string]: string | Messages };

export interface EmailProps {
  locale: Locale;
  /** Looks up a text of this template: `t("title")`. */
  t: (key: string) => string;
  /** Looks up a shared text: `common("greeting")`. */
  common: (key: string) => string;
}

function lookup(messages: Messages, path: string): string {
  let value: string | Messages | undefined = messages;
  for (const key of path.split(".")) {
    value = typeof value === "object" ? value[key] : undefined;
  }
  if (typeof value !== "string") throw new Error(`missing text "${path}"`);
  return value;
}

export function translator(messages: Messages, name: string) {
  return {
    t: (key: string) => lookup(messages, `${name}.${key}`),
    common: (key: string) => lookup(messages, `common.${key}`),
  };
}

/**
 * A run-time variable: left in the HTML as `{{name}}` for the API to replace
 * (HTML-escaped) when it sends the message.
 */
export function v(name: string): string {
  return `{{${name}}}`;
}
