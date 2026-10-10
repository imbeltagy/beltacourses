import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { PERMISSION_GROUPS } from '@repo/backend/core';
import type { PublicUser } from '../users/users.types';
import { UsersService } from '../users/users.service';
import type { CreateGroupDto } from './dto/request/create-group.dto';
import type { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import type { UpdateGroupDto } from './dto/request/update-group.dto';
import { GroupsRepository } from './groups.repository';
import type { ListGroupsResult, PublicGroup } from './groups.types';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateGroupDto): Promise<PublicGroup> {
    const existing = await this.groupsRepository.findIdByName(dto.name);
    if (existing) throw new AppException(ErrorCode.GROUP_NAME_ALREADY_EXISTS);

    return this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions,
    });
  }

  async findById(id: string): Promise<PublicGroup> {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new AppException(ErrorCode.GROUP_NOT_FOUND);
    return group;
  }

  list(query: ListGroupsQueryDto): Promise<ListGroupsResult> {
    return this.groupsRepository.findMany(query).then(({ items, total }) => ({
      items,
      total,
      page: query.page,
      limit: query.limit,
    }));
  }

  async update(id: string, dto: UpdateGroupDto): Promise<PublicGroup> {
    const existing = await this.groupsRepository.findById(id);
    if (!existing) throw new AppException(ErrorCode.GROUP_NOT_FOUND);

    if (dto.name && dto.name !== existing.name) {
      const clash = await this.groupsRepository.findIdByName(dto.name);
      if (clash) throw new AppException(ErrorCode.GROUP_NAME_ALREADY_EXISTS);
    }

    return this.groupsRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.permissions !== undefined
        ? { permissions: dto.permissions }
        : {}),
    });
  }

  /**
   * Does not clear `User.group_id`: `onDelete: SetNull` only fires on a
   * hard delete, and `PermissionsRepository.findByUserId` already returns
   * `[]` for a soft-deleted group. So an admin whose group is soft-deleted
   * silently loses all permissions, which is the correct fail-closed
   * outcome.
   */
  async softDelete(id: string): Promise<void> {
    const changed = await this.groupsRepository.softDelete(id);
    if (changed === 0) throw new AppException(ErrorCode.GROUP_NOT_FOUND);
  }

  permissionCatalog(): typeof PERMISSION_GROUPS {
    return PERMISSION_GROUPS;
  }

  async assignUser(groupId: string, userId: string): Promise<PublicUser> {
    await this.findById(groupId);
    return this.usersService.setGroup(userId, groupId);
  }

  /**
   * Checking membership first (rather than unconditionally clearing
   * `group_id`) is what makes this route honest — without it it would
   * happily "remove" a user from a group they were never in, and would let
   * a stale UI clear an assignment someone else had just changed.
   */
  async unassignUser(groupId: string, userId: string): Promise<void> {
    await this.findById(groupId);

    const user = await this.usersService.findById(userId);
    if (user.group?.id !== groupId) {
      throw new AppException(ErrorCode.USER_NOT_IN_GROUP);
    }

    await this.usersService.setGroup(userId, null);
  }
}
