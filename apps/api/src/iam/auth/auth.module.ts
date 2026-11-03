import { Module } from '@nestjs/common';
import {
  PasswordService,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, PasswordService, TokenService, SessionService],
  exports: [AuthService],
})
export class AuthModule {}
