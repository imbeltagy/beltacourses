import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { imgUrl } from "@repo/frontend/utils/img-url";
import type { Messages } from "./i18n.ts";
import { LOCALES } from "./locales.ts";
import { renderEmail } from "./render.ts";
import { templates, type TemplateName } from "./templates/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist");

async function main() {
  const logoUrl = imgUrl("assets/logo/logo-lg-300.png");
  if (!/^https?:\/\//.test(logoUrl)) {
    throw new Error(
      `NEXT_PUBLIC_STATIC_IMAGES_URL must be an absolute URL, got "${logoUrl}". ` +
        "An email opens far from this app, so a relative image path cannot load.",
    );
  }

  const names = Object.keys(templates) as TemplateName[];
  await rm(outDir, { recursive: true, force: true });

  for (const locale of LOCALES) {
    const messages = JSON.parse(
      await readFile(path.join(root, `src/locales/${locale}.json`), "utf8"),
    ) as Messages;
    const subjects: Record<string, string> = {};
    await mkdir(path.join(outDir, locale), { recursive: true });

    for (const name of names) {
      try {
        const { html, subject } = await renderEmail({
          name,
          locale,
          messages,
          logoUrl,
        });
        await writeFile(path.join(outDir, locale, `${name}.html`), html);
        subjects[name] = subject;
      } catch (error) {
        throw new Error(`${locale}/${name}: ${(error as Error).message}`);
      }
    }

    await writeFile(
      path.join(outDir, locale, "subjects.json"),
      JSON.stringify(subjects, null, 2),
    );
  }

  console.log(`emails: ${names.length} templates × ${LOCALES.length} locales`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
