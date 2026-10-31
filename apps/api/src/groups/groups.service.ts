import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { PERMISSION_GROUPS } from '@repo/backend/core';
import type { Paginated } from '@repo/backend/pagination';
import type { CreateGroupDto } from './dto/request/create-group.dto';
import type { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import type { UpdateGroupDto } from './dto/request/update-group.dto';
import { GroupsRepository } from './groups.repository';
import type { GroupWithRelations } from './groups.types';

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  async create(dto: CreateGroupDto): Promise<GroupWithRelations> {
    const existing = await this.groupsRepository.findIdByName(dto.name);
    if (existing) throw new AppException(ErrorCode.GROUP_NAME_ALREADY_EXISTS);

    return this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions,
    });
  }

  async findById(id: string): Promise<GroupWithRelations> {
    const group = await this.groupsRepository.findById(id);
    if (!group) throw new AppException(ErrorCode.GROUP_NOT_FOUND);
    return group;
  }

  async list(
    query: ListGroupsQueryDto,
  ): Promise<Paginated<GroupWithRelations>> {
    const { items, total } = await this.groupsRepository.findMany(query);
    return {
      data: items,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async update(id: string, dto: UpdateGroupDto): Promise<GroupWithRelations> {
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

  // Admin whose group is soft-deleted silently loses all permissions
  async softDelete(id: string): Promise<void> {
    const changed = await this.groupsRepository.softDelete(id);
    if (changed === 0) throw new AppException(ErrorCode.GROUP_NOT_FOUND);
  }

  permissionCatalog(): typeof PERMISSION_GROUPS {
    return PERMISSION_GROUPS;
  }
}
