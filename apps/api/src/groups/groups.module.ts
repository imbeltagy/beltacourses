import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/service/core';
import { UsersModule } from '../users/users.module';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

/**
 * The dependency runs groups -> users, and only that way. `UsersModule`
 * must not import `GroupsModule` — that would be a cycle, and it is the
 * reason D18's endpoints live here rather than at `PUT /users/:id/group`.
 */
@Module({
  imports: [UsersModule],
  controllers: [GroupsController],
  providers: [
    GroupsService,
    GroupsRepository,
    TokenService,
    SessionService,
    PermissionsRepository,
    AccessTokenGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [GroupsService],
})
export class GroupsModule {}
