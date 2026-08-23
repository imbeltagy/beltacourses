import { Module } from '@nestjs/common';
import { PasswordService, TokenService } from '@repo/service/core';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
