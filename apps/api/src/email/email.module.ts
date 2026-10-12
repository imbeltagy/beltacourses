import { Module } from '@nestjs/common';
import {
  EmailService,
  EmailTemplatesAdapter,
  MailAdapter,
} from '@repo/backend/email';

@Module({
  providers: [EmailService, EmailTemplatesAdapter, MailAdapter],
  exports: [EmailService],
})
export class EmailModule {}
