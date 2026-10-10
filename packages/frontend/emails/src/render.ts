import { render } from "@react-email/components";
import { createElement } from "react";
import { translator, type Messages } from "./i18n.ts";
import type { Locale } from "./locales.ts";
import { templates, type TemplateName } from "./templates/index.ts";

export interface RenderOptions {
  name: TemplateName;
  locale: Locale;
  messages: Messages;
  /** Absolute URL of the logo; email clients cannot resolve a relative one. */
  logoUrl: string;
}

export async function renderEmail({
  name,
  locale,
  messages,
  logoUrl,
}: RenderOptions): Promise<{ html: string; subject: string }> {
  const { t, common } = translator(messages, name);
  const html = await render(
    createElement(templates[name], { locale, t, common, logoUrl }),
  );
  return { html, subject: t("subject") };
}
