import { Injectable } from '@nestjs/common';
import { EmailTemplatesAdapter } from './email-templates.adapter';
import { SmtpAdapter } from './smtp.adapter';
import type { EmailTemplateName, SendEmailInput } from './email.types';

const VARIABLE = /\{\{\s*(\w+)\s*\}\}/g;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Fills `{{name}}` placeholders; a variable the template needs but did not get is a bug, not a blank. */
export function fillVariables(
  source: string,
  variables: Record<string, string | number>,
  escape: boolean,
): string {
  return source.replace(VARIABLE, (_, name: string) => {
    const value = variables[name];
    if (value === undefined) {
      throw new Error(`Email variable "${name}" was not provided`);
    }
    const text = String(value);
    return escape
      ? text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)
      : text;
  });
}

@Injectable()
export class EmailService {
  constructor(
    private readonly templates: EmailTemplatesAdapter,
    private readonly smtp: SmtpAdapter,
  ) {}

  /**
   * Throws when the template cannot be rendered or the mail server refuses.
   * Whether that should fail the caller's request is the caller's call.
   */
  async send<T extends EmailTemplateName>(
    template: T,
    input: SendEmailInput<T>,
  ): Promise<void> {
    const { html, subject } = await this.templates.load(template, input.locale);
    const variables: Record<string, string | number> = { ...input.variables };

    await this.smtp.send({
      to: input.to,
      subject: fillVariables(subject, variables, false),
      // Values are user data (a name can contain `<`), so they are escaped into HTML.
      html: fillVariables(html, variables, true),
    });
  }
}
