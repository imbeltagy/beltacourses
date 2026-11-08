import { Module } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

@Module({
  providers: [GroupsService, GroupsRepository],
  exports: [GroupsService],
})
export class GroupsModule {}
