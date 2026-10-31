import { ErrorResponseDto } from '../common/dto/response/error.dto';
import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@repo/backend/core';
import type { RequestUser } from '@repo/backend/core';
import { UserResponseDto } from '../users/dto/response/user.dto';
import { REGISTERABLE_ROLES } from '../users/users.constants';
import { UserMapper } from '../users/users.mapper';
import { AuthService } from './auth.service';
import { AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL } from './auth.constants';
import { Auth } from './decorators/auth.decorator';
import { LoginDto } from './dto/request/login.dto';
import { RefreshDto } from './dto/request/refresh.dto';
import { RegisterDto } from './dto/request/register.dto';
import { LoginResponseDto } from './dto/response/login.dto';
import { RefreshResponseDto } from './dto/response/refresh.dto';

const REGISTER_BODY = {
  schema: {
    type: 'object' as const,
    required: ['email', 'password', 'name', 'role'],
    properties: {
      email: { type: 'string', example: 'student@beltacourses.com' },
      password: { type: 'string', example: 'correcthorse' },
      name: { type: 'string', example: 'Jane Doe' },
      role: { type: 'string', enum: [...REGISTERABLE_ROLES] },
      avatar: {
        type: 'string',
        format: 'binary',
        description: 'Optional avatar image file.',
      },
    },
  },
};

const AUTH_THROTTLE = {
  default: {
    limit: AUTH_THROTTLE_LIMIT,
    ttl: AUTH_THROTTLE_TTL,
  },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(REGISTER_BODY)
  @ApiOperation({ summary: 'Register as a student or a teacher' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already in use.',
  })
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const user = await this.authService.register(dto, avatar);
    return UserMapper.toDto(user);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Log in with email and password (clients only)' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid credentials.',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many attempts.',
  })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('moderators/login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Log in as staff (admin or super_admin only)' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid credentials.',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many attempts.',
  })
  loginModerator(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.loginModerator(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid, expired or revoked refresh token.',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'Too many attempts.',
  })
  refresh(@Body() dto: RefreshDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(204)
  @Auth()
  @ApiOperation({ summary: 'Log out (revokes the moderator session, if any)' })
  @ApiNoContentResponse()
  logout(@CurrentUser() user: RequestUser): Promise<void> {
    return this.authService.logout(user);
  }
}
