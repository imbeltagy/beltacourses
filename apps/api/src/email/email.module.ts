import { Module } from '@nestjs/common';
import {
  EmailService,
  EmailTemplatesAdapter,
  MailAdapter,
} from '@repo/backend/email';
import { AccountEmailsService } from './account-emails.service';

@Module({
  providers: [
    EmailService,
    EmailTemplatesAdapter,
    MailAdapter,
    AccountEmailsService,
  ],
  exports: [EmailService, AccountEmailsService],
})
export class EmailModule {}
