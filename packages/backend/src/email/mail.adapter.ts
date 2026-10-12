import { Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import {
  NODEMAILER_PASS,
  NODEMAILER_SENDER_EMAIL,
  NODEMAILER_USER,
} from './email.constants';
import type { RawEmail } from './email.types';

/** The only class that knows nodemailer (and Gmail behind it) exists. */
@Injectable()
export class MailAdapter {
  private readonly transporter: Transporter;
  private readonly senderEmail: string;

  constructor() {
    const missing = Object.entries({
      NODEMAILER_USER,
      NODEMAILER_PASS,
      NODEMAILER_SENDER_EMAIL,
    })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(
        `Email is not configured, missing: ${missing.join(', ')}`,
      );
    }

    this.senderEmail = NODEMAILER_SENDER_EMAIL as string;
    this.transporter = createTransport({
      service: 'gmail',
      auth: { user: NODEMAILER_USER, pass: NODEMAILER_PASS },
    });
  }

  async send(email: RawEmail): Promise<void> {
    await this.transporter.sendMail({
      from: this.senderEmail,
      ...email,
      headers: this.headers(),
    });
  }

  private headers(): Record<string, string> {
    const domain = this.senderEmail.split('@')[1] || 'beltacourse.com';
    const random = () => Math.random().toString(36).substring(2, 13);
    return {
      'Message-ID': `<${Date.now()}-${random()}@${domain}>`,
      'X-Auto-Response-Suppress': 'All',
      'Auto-Submitted': 'auto-generated',
      'X-Mailer': 'BeltaCourse',
      'X-Entity-Ref-ID': `${Date.now()}-${random()}`,
    };
  }
}
