import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EmailModule } from '../email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthController } from './controllers/auth.controller';
import { GroupsController } from './controllers/groups.controller';
import { UsersController } from './controllers/users.controller';
import { GroupsModule } from './modules/groups/groups.module';
import { AuthGuard } from './guards/auth.guard';
import { IamFacade } from './iam.facade';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [AuthModule, UserModule, GroupsModule, EmailModule],
  controllers: [AuthController, UsersController, GroupsController],
  providers: [IamFacade, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class IamModule {}
