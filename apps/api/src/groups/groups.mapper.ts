import { plainToInstance } from 'class-transformer';
import type { Paginated } from '@repo/backend/pagination';
import { GroupResponseDto } from './dto/response/group.dto';
import { ListGroupsResponseDto } from './dto/response/list-groups.dto';
import type { GroupWithRelations } from './groups.types';

export class GroupMapper {
  static toDto(group: GroupWithRelations): GroupResponseDto {
    return plainToInstance(GroupResponseDto, group, {
      excludeExtraneousValues: true,
    });
  }

  static toListDto(page: Paginated<GroupWithRelations>): ListGroupsResponseDto {
    return plainToInstance(ListGroupsResponseDto, page, {
      excludeExtraneousValues: true,
    });
  }
}
