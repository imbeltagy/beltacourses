import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';
import { TokensUtil } from './tokens.util';

@Module({
  providers: [
    AuthService,
    PasswordService,
    TokensUtil,
    SessionService,
    SessionRepository,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
