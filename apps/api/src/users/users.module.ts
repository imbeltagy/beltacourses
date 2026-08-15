import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PasswordService } from './password.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/**
 * `PasswordService` and `UsersRepository` are provided but not exported: they
 * are the only two classes that ever hold a password hash, so keeping them
 * inside this module means no other feature can accidentally log, serialize or
 * return one. Everything else injects `UsersService`.
 */
@Module({
  imports: [StorageModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
