import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PasswordService,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import { EmailModule } from '../email/email.module';
import { GroupsModule } from '../groups/groups.module';
import { StorageModule } from '../storage/storage.module';
import { AccountEmailsService } from './account-emails.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [StorageModule, EmailModule, GroupsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    AccountEmailsService,
    UsersRepository,
    PasswordService,
    TokenService,
    SessionService,
    PermissionsRepository,
    AccessTokenGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
