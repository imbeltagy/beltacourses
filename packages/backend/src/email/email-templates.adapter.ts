import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { EMAIL_TEMPLATES_DIR } from './email.constants';
import type { EmailLocale, EmailTemplateName } from './email.types';

export interface LoadedTemplate {
  subject: string;
  html: string;
}

/**
 * Reads the output of `@repo/frontend-emails` (`<locale>/<name>.html` and
 * `<locale>/subjects.json`) from disk. Files do not change while the process
 * runs, so each one is read once.
 */
@Injectable()
export class EmailTemplatesAdapter {
  private readonly html = new Map<string, Promise<string>>();
  private readonly subjects = new Map<
    EmailLocale,
    Promise<Record<string, string>>
  >();

  async load(
    name: EmailTemplateName,
    locale: EmailLocale,
  ): Promise<LoadedTemplate> {
    const [html, subjects] = await Promise.all([
      this.cached(this.html, `${locale}/${name}`, () =>
        this.read(`${locale}/${name}.html`),
      ),
      this.cached(
        this.subjects,
        locale,
        async () =>
          JSON.parse(await this.read(`${locale}/subjects.json`)) as Record<
            string,
            string
          >,
      ),
    ]);

    const subject = subjects[name];
    if (subject === undefined) {
      throw new Error(`No "${name}" subject for locale "${locale}"`);
    }
    return { html, subject };
  }

  private cached<K, V>(
    cache: Map<K, Promise<V>>,
    key: K,
    load: () => Promise<V>,
  ) {
    let value = cache.get(key);
    if (!value) {
      value = load();
      // A failed read must not stay cached, or a late build would never be seen.
      value.catch(() => cache.delete(key));
      cache.set(key, value);
    }
    return value;
  }

  private async read(file: string): Promise<string> {
    try {
      return await readFile(path.join(EMAIL_TEMPLATES_DIR, file), 'utf8');
    } catch (error) {
      throw new Error(
        `Cannot read email template "${file}" in ${EMAIL_TEMPLATES_DIR}. ` +
          `Run \`pnpm --filter @repo/frontend-emails build\` or set EMAIL_TEMPLATES_DIR.`,
        { cause: error },
      );
    }
  }
}
