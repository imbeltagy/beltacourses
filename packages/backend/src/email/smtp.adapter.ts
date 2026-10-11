import { Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import {
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USER,
} from './email.constants';
import type { RawEmail } from './email.types';

/** The only class that knows an SMTP server exists. */
@Injectable()
export class SmtpAdapter {
  private readonly transport: Transporter;

  constructor() {
    const missing = Object.entries({ SMTP_HOST, SMTP_PORT, EMAIL_FROM })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(
        `Email is not configured, missing: ${missing.join(', ')}`,
      );
    }

    const port = Number(SMTP_PORT);
    this.transport = createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {}),
    });
  }

  async send(email: RawEmail): Promise<void> {
    await this.transport.sendMail({ from: EMAIL_FROM, ...email });
  }
}
