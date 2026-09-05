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
  Put,
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
import { MODERATOR_ROLES, PERMISSIONS } from '@repo/service/core';
import { Role } from '@repo/db';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserResponse } from '../users/dto/response/user.dto';
import { CreateGroupDto } from './dto/request/create-group.dto';
import { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import { UpdateGroupDto } from './dto/request/update-group.dto';
import { GroupResponse } from './dto/response/group.dto';
import { ListGroupsResponse } from './dto/response/list-groups.dto';
import { PERMISSION_CATALOG_SCHEMA } from './dto/response/permission-catalog.dto';
import type { PermissionCatalogResponse } from './dto/response/permission-catalog.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /**
   * Route-order trap: `GET /groups/:id` uses `ParseUUIDPipe`, so if `:id`
   * were declared first the literal path `/groups/permissions` would 400
   * instead of resolving. Must stay declared before `GET /groups/:id`.
   */
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

  /**
   * Writes are `super_admin`-only while reads accept `groups:read`: an
   * admin who could edit groups could grant themselves `users:*` —
   * self-escalation. Reads are safe and an admin UI needs the catalog to
   * render, so reads are permission-gated and writes are role-gated.
   */
  @Post()
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Create a permission group' })
  @ApiCreatedResponse({ type: GroupResponse })
  @ApiConflictResponse({ description: 'Group name already in use.' })
  create(@Body() dto: CreateGroupDto): Promise<GroupResponse> {
    return this.groupsService.create(dto);
  }

  @Get()
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.GROUPS_READ })
  @ApiOperation({ summary: 'List permission groups' })
  @ApiOkResponse({ type: ListGroupsResponse })
  list(@Query() query: ListGroupsQueryDto): Promise<ListGroupsResponse> {
    return this.groupsService.list(query);
  }

  @Get(':id')
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.GROUPS_READ })
  @ApiOperation({ summary: 'Get a permission group by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GroupResponse })
  @ApiNotFoundResponse({
    description: 'Unknown id, or the group was soft-deleted.',
  })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<GroupResponse> {
    return this.groupsService.findById(id);
  }

  @Patch(':id')
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Update a permission group' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GroupResponse })
  @ApiNotFoundResponse({
    description: 'Unknown id, or the group was soft-deleted.',
  })
  @ApiConflictResponse({ description: 'Group name already in use.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponse> {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Soft-delete a permission group' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ description: 'Unknown id, or already deleted.' })
  softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.groupsService.softDelete(id);
  }

  @Put(':group_id/users/:user_id')
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Assign an admin to a permission group' })
  @ApiParam({ name: 'group_id', format: 'uuid' })
  @ApiParam({ name: 'user_id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'Unknown group or user.' })
  assignUser(
    @Param('group_id', ParseUUIDPipe) groupId: string,
    @Param('user_id', ParseUUIDPipe) userId: string,
  ): Promise<UserResponse> {
    return this.groupsService.assignUser(groupId, userId);
  }

  @Delete(':group_id/users/:user_id')
  @HttpCode(204)
  @Auth({ roles: Role.super_admin })
  @ApiOperation({ summary: 'Unassign an admin from a permission group' })
  @ApiParam({ name: 'group_id', format: 'uuid' })
  @ApiParam({ name: 'user_id', format: 'uuid' })
  @ApiNotFoundResponse({
    description:
      'Unknown group or user, or the user is not a member of that group.',
  })
  unassignUser(
    @Param('group_id', ParseUUIDPipe) groupId: string,
    @Param('user_id', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupsService.unassignUser(groupId, userId);
  }
}
