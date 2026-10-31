import { ErrorResponseDto } from '@repo/backend/errors';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MODERATOR_ROLES, PERMISSIONS } from '@repo/backend/core';
import { Role } from '@repo/db';
import { Auth } from '../auth/decorators/auth.decorator';
import { CreateGroupDto } from './dto/request/create-group.dto';
import { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import { UpdateGroupDto } from './dto/request/update-group.dto';
import { GroupResponseDto } from './dto/response/group.dto';
import { ListGroupsResponseDto } from './dto/response/list-groups.dto';
import { PERMISSION_CATALOG_SCHEMA } from './dto/response/permission-catalog.dto';
import type { PermissionCatalogResponse } from './dto/response/permission-catalog.dto';
import { GroupsService } from './groups.service';
import { GroupMapper } from './groups.mapper';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('permissions')
  @Auth({
    roles: MODERATOR_ROLES,
    permissions: PERMISSIONS.GROUPS_READ,
  })
  @ApiOperation({
    summary: 'The hardcoded catalog of every assignable permission',
  })
  @ApiOkResponse({ schema: PERMISSION_CATALOG_SCHEMA })
  permissionCatalog(): PermissionCatalogResponse {
    return this.groupsService.permissionCatalog();
  }

  @Post()
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Create a permission group' })
  @ApiCreatedResponse({ type: GroupResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Group name already in use.',
  })
  async create(@Body() dto: CreateGroupDto): Promise<GroupResponseDto> {
    const group = await this.groupsService.create(dto);
    return GroupMapper.toDto(group);
  }

  @Get()
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.GROUPS_READ })
  @ApiOperation({ summary: 'List permission groups' })
  @ApiOkResponse({ type: ListGroupsResponseDto })
  async list(
    @Query() query: ListGroupsQueryDto,
  ): Promise<ListGroupsResponseDto> {
    const result = await this.groupsService.list(query);
    return GroupMapper.toListDto(result);
  }

  @Get(':id')
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.GROUPS_READ })
  @ApiOperation({ summary: 'Get a permission group by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GroupResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id.',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsService.findById(id);
    return GroupMapper.toDto(group);
  }

  @Patch(':id')
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Update a permission group' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GroupResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Group name already in use.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsService.update(id, dto);
    return GroupMapper.toDto(group);
  }

  @Delete(':id')
  @HttpCode(204)
  @Auth({ roles: Role.super_admin })
  @ApiOperation({
    summary: 'Delete a permission group',
    description: 'Permanent. Admins in the group are left with no group.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id.',
  })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.groupsService.delete(id);
  }
}
