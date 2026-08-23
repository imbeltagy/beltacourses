import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PasswordService,
  TokenService,
  UsersRepository as AccessCheckRepository,
} from '@repo/service/core';
import { StorageModule } from '../storage/storage.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [StorageModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    PasswordService,
    TokenService,
    AccessCheckRepository,
    AccessTokenGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
