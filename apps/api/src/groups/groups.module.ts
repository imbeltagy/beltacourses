import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

@Module({
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
