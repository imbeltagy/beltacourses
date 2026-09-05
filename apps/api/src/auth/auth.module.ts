import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PasswordService,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/service/core';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    PermissionsRepository,
    AccessTokenGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
