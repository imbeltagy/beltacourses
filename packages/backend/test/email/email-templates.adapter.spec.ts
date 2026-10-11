import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'emails-'));
process.env.EMAIL_TEMPLATES_DIR = dir;

import { EmailTemplatesAdapter } from '../../src/email/email-templates.adapter';

describe('EmailTemplatesAdapter', () => {
  beforeAll(() => {
    mkdirSync(path.join(dir, 'en'));
    writeFileSync(path.join(dir, 'en', 'reset-password.html'), '<p>hi</p>');
    writeFileSync(
      path.join(dir, 'en', 'subjects.json'),
      JSON.stringify({ 'reset-password': 'Reset' }),
    );
  });

  it('reads the html and the subject for a locale', async () => {
    await expect(
      new EmailTemplatesAdapter().load('reset-password', 'en'),
    ).resolves.toEqual({ html: '<p>hi</p>', subject: 'Reset' });
  });

  it('names the build command when the output is missing', async () => {
    await expect(
      new EmailTemplatesAdapter().load('reset-password', 'ar'),
    ).rejects.toThrow(/frontend-emails build/);
  });

  it('rejects a template that has no subject', async () => {
    await expect(
      new EmailTemplatesAdapter().load('verify-email', 'en'),
    ).rejects.toThrow(/Cannot read|No "verify-email"/);
  });
});
