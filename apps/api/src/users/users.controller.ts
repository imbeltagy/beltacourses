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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard, CurrentUser } from '@repo/service/core';
import type { RequestUser } from '@repo/service/core';
import { CreateUserDto } from './dto/request/create-user.dto';
import { ListUsersQueryDto } from './dto/request/list-users.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { ListUsersResponse } from './dto/response/list-users.dto';
import { UserResponse } from './dto/response/user.dto';
import { UsersService } from './users.service';
import { UpdateMyProfileDto } from './dto/request/update-my-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a user (admin only, in a future task)' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email already in use.' })
  create(
    @Body() dto: CreateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponse> {
    return this.usersService.create(dto, avatar);
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: ListUsersResponse })
  list(@Query() query: ListUsersQueryDto): Promise<ListUsersResponse> {
    return this.usersService.list(query);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my own profile' })
  @ApiOkResponse({ type: UserResponse })
  getMe(@CurrentUser() user: RequestUser): Promise<UserResponse> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update my own profile' })
  @ApiOkResponse({ type: UserResponse })
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMyProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponse> {
    return this.usersService.update(user.id, dto, avatar);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({
    description: 'Unknown id, or the user was soft-deleted.',
  })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({
    description: 'Unknown id, or the user was soft-deleted.',
  })
  @ApiConflictResponse({ description: 'Email already in use.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponse> {
    return this.usersService.update(id, dto, avatar);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ description: 'Unknown id, or already deleted.' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }
}
