import { Injectable, Logger } from '@nestjs/common';
import { isModerator } from '@repo/backend/core';
import { EmailService, type EmailLocale } from '@repo/backend/email';
import type { Role } from '@repo/db';
import { ADMIN_URL, CLIENT_URL } from './users.constants';

@Injectable()
export class AccountEmailsService {
  private readonly logger = new Logger(AccountEmailsService.name);

  constructor(private readonly emailService: EmailService) {
    const missing = Object.entries({ CLIENT_URL, ADMIN_URL })
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length > 0) {
      throw new Error(`Account emails need ${missing.join(', ')} to be set`);
    }
  }

  /**
   * Best effort: the account already exists by the time this runs, so a mail
   * server outage is logged rather than turned into a failed request.
   */
  async sendAccountCreated(
    user: { name: string; email: string; role: Role },
    locale: EmailLocale,
  ): Promise<void> {
    // Staff sign in to the admin app, everyone else to the public one.
    const base = isModerator(user.role) ? ADMIN_URL : CLIENT_URL;
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
