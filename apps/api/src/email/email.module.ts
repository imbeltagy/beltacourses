import { Module } from '@nestjs/common';
import {
  EmailService,
  EmailTemplatesAdapter,
  SmtpAdapter,
} from '@repo/backend/email';

@Module({
  providers: [EmailService, EmailTemplatesAdapter, SmtpAdapter],
  exports: [EmailService],
})
export class EmailModule {}
