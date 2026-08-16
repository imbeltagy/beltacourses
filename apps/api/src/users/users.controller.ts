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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
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
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Unlike /auth/register this accepts a role and the full profile, so it ' +
      'is how privileged accounts are made — any role except super_admin. The ' +
      'avatar can be uploaded in this request, or referenced by avatar_id if ' +
      'it was uploaded through POST /storage; sending both is an error. Role ' +
      'is fixed here: PATCH cannot change it.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email already in use.' })
  @ApiBadRequestResponse({
    description:
      'Validation failed, super_admin was requested, avatar_id does not ' +
      'resolve to a file, or both avatar and avatar_id were sent.',
  })
  create(
    @Body() dto: CreateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<PublicUser> {
    return this.usersService.create(dto, avatar);
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
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Update a user',
    description:
      'Takes the same profile fields as POST /users, including a replacement ' +
      'avatar, with two exceptions: the password is not changed here, and the ' +
      'role cannot change at all — it is fixed when the account is created. ' +
      'Send bio, gender, date_of_birth or avatar_id empty to clear them.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'Unknown id, or the user was deleted.' })
  @ApiConflictResponse({ description: 'Email already in use by another user.' })
  @ApiBadRequestResponse({
    description:
      'Validation failed, avatar_id does not resolve to a file, or both ' +
      'avatar and avatar_id were sent.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<PublicUser> {
    return this.usersService.update(id, dto, avatar);
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
