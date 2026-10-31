import { ErrorResponseDto } from '../common/dto/response/error.dto';
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
  ApiConflictResponse,
  ApiConsumes,
  ApiHeader,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, MODERATOR_ROLES, PERMISSIONS } from '@repo/backend/core';
import type { RequestUser } from '@repo/backend/core';
import { EmailLocaleParam } from '../common/decorators/email-locale.decorator';
import type { EmailLocale } from '@repo/backend/email';
import { Auth } from '../auth/decorators/auth.decorator';
import { CreateUserDto } from './dto/request/create-user.dto';
import { ListUsersQueryDto } from './dto/request/list-users.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { ListUsersResponseDto } from './dto/response/list-users.dto';
import { UserResponseDto } from './dto/response/user.dto';
import { UsersService } from './users.service';
import { UserMapper } from './users.mapper';
import { UpdateMyProfileDto } from './dto/request/update-my-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.USERS_CREATE })
  @ApiOperation({
    summary: 'Create a user',
    description:
      'Emails the new user that their account exists, in the language of `Accept-Language`.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description:
      'Language of the email, `en` or `ar`. Anything else gets `en`.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already in use.',
  })
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @EmailLocaleParam() locale: EmailLocale,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto, avatar, locale);
    return UserMapper.toDto(user);
  }

  @Get()
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.USERS_READ })
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: ListUsersResponseDto })
  async list(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    const result = await this.usersService.list(query);
    return UserMapper.toListDto(result);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Get my own profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(@CurrentUser() user: RequestUser): Promise<UserResponseDto> {
    const profile = await this.usersService.findById(user.id);
    return UserMapper.toDto(profile);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @Auth()
  @ApiOperation({ summary: 'Update my own profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMyProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.update(user.id, dto, avatar);
    return UserMapper.toDto(updated);
  }

  @Get(':id')
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.USERS_READ })
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id, or the user was soft-deleted.',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return UserMapper.toDto(user);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.USERS_UPDATE })
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id, or the user was soft-deleted.',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already in use.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto, avatar);
    return UserMapper.toDto(user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Auth({ roles: MODERATOR_ROLES, permissions: PERMISSIONS.USERS_DELETE })
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Unknown id, or already deleted.',
  })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }
}
