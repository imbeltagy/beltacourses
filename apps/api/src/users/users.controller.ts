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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/request/create-user.dto';
import { ListUsersQueryDto } from './dto/request/list-users.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { ListUsersResponse } from './dto/response/list-users.dto';
import { UserResponse } from './dto/response/user.dto';
import { UsersService } from './users.service';
import type { ListUsersResult, PublicUser } from './users.types';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Unlike /auth/register this accepts a role, so it is how privileged ' +
      'accounts are made.',
  })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email already in use.' })
  @ApiBadRequestResponse({
    description: 'Validation failed, or avatar_id does not resolve to a file.',
  })
  create(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Soft-deleted users are never listed.',
  })
  @ApiOkResponse({ type: ListUsersResponse })
  list(@Query() query: ListUsersQueryDto): Promise<ListUsersResult> {
    return this.usersService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by id',
    description: 'Soft-deleted users are treated as missing and return 404.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'Unknown id, or the user was deleted.' })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUser> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Passwords are not changed here. Send null for bio, gender, ' +
      'date_of_birth or avatar_id to clear the field.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'Unknown id, or the user was deleted.' })
  @ApiConflictResponse({ description: 'Email already in use by another user.' })
  @ApiBadRequestResponse({
    description: 'Validation failed, or avatar_id does not resolve to a file.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Soft-delete a user',
    description: 'The row stays, but the user reads as missing everywhere.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'The user was deleted.' })
  @ApiNotFoundResponse({ description: 'Unknown id, or already deleted.' })
  softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }
}
