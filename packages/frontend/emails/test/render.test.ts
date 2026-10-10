import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { Messages } from "../src/i18n.ts";
import { LOCALES, type Locale } from "../src/locales.ts";
import { renderEmail } from "../src/render.ts";
import { templates, type TemplateName } from "../src/templates/index.ts";

const locales = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/locales",
);

async function render(name: TemplateName, locale: Locale) {
  const messages = JSON.parse(
    await readFile(path.join(locales, `${locale}.json`), "utf8"),
  ) as Messages;
  return renderEmail({
    name,
    locale,
    messages,
    logoUrl: "https://files.example.com/assets/logo/logo-lg-300.png",
  });
}

describe("every template in every locale", () => {
  for (const locale of LOCALES) {
    for (const name of Object.keys(templates) as TemplateName[]) {
      it(`${locale}/${name} renders with a subject, the logo and run-time variables`, async () => {
        const { html, subject } = await render(name, locale);
        assert.ok(subject.length > 0);
        assert.match(html, /logo-lg-300\.png/);
        assert.match(html, /\{\{name\}\}/);
      });
    }
  }
});

describe("run-time variables", () => {
  it("survive into attributes untouched", async () => {
    const { html } = await render("reset-password", "en");
    assert.match(html, /href="\{\{resetUrl\}\}"/);
  });
});

describe("direction", () => {
  it("is right-to-left for ar", async () => {
    const { html } = await render("reset-password", "ar");
    assert.match(html, /<html[^>]*dir="rtl"/);
    assert.match(html, /text-align:right/);
  });

  it("is left-to-right for en", async () => {
    const { html } = await render("reset-password", "en");
    assert.match(html, /<html[^>]*dir="ltr"/);
    assert.match(html, /text-align:left/);
  });
});

describe("missing text", () => {
  it("fails the render instead of printing a blank", async () => {
    await assert.rejects(
      renderEmail({
        name: "reset-password",
        locale: "en",
        messages: { common: {} },
        logoUrl: "https://x.test/l.png",
      }),
      /missing text/,
    );
  });
});
