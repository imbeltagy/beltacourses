import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { LEGACY_GUARD_PROVIDERS } from './auth/legacy-guards.providers';
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
    ...LEGACY_GUARD_PROVIDERS,
  ],
})
export class IamModule {}
