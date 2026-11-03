import { Module } from '@nestjs/common';
import {
  AccessTokenGuard,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import { EmailModule } from '../email/email.module';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './controllers/auth.controller';
import { GroupsController } from './controllers/groups.controller';
import { UsersController } from './controllers/users.controller';
import { GroupsModule } from './groups/groups.module';
import { IamFacade } from './iam.facade';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthModule, UserModule, GroupsModule, EmailModule],
  controllers: [AuthController, UsersController, GroupsController],
  providers: [
    IamFacade,
    // Guards composed by @Auth() resolve in the module that owns the controllers.
    TokenService,
    SessionService,
    PermissionsRepository,
    AccessTokenGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class IamModule {}
