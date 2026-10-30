import { Injectable, Logger } from '@nestjs/common';
import { isModerator } from '@repo/backend/core';
import { EmailService, type EmailLocale } from '@repo/backend/email';
import type { Role } from '@repo/db';
import { ADMIN_FRONTEND_URL, CLIENT_FRONTEND_URL } from './users.constants';

@Injectable()
export class AccountEmailsService {
  private readonly logger = new Logger(AccountEmailsService.name);

  constructor(private readonly emailService: EmailService) {
    const missing = Object.entries({ CLIENT_FRONTEND_URL, ADMIN_FRONTEND_URL })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(`Account emails need ${missing.join(', ')} to be set`);
    }
  }

  async sendAccountCreated(
    user: { name: string; email: string; role: Role },
    locale: EmailLocale,
  ): Promise<void> {
    const base = isModerator(user.role)
      ? ADMIN_FRONTEND_URL
      : CLIENT_FRONTEND_URL;
    try {
      await this.emailService.send('account-created', {
        to: user.email,
        locale,
        variables: {
          name: user.name,
          email: user.email,
          loginUrl: `${(base ?? '').replace(/\/+$/, '')}/${locale}/login`,
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not send the account-created email: ${(error as Error).message}`,
      );
    }
  }
}
