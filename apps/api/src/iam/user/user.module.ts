import { Module } from '@nestjs/common';
import { PasswordService } from '@repo/backend/core';
import { StorageModule } from '../../storage/storage.module';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [StorageModule],
  providers: [UserService, UserRepository, PasswordService],
  exports: [UserService],
})
export class UserModule {}
