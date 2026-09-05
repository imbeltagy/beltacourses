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
import { CurrentUser } from '@repo/service/core';
import type { RequestUser } from '@repo/service/core';
import { UserResponse } from '../users/dto/response/user.dto';
import { REGISTERABLE_ROLES } from '../users/users.constants';
import { AuthService } from './auth.service';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL_SECONDS,
} from './auth.constants';
import { Auth } from './decorators/auth.decorator';
import { LoginDto } from './dto/request/login.dto';
import { RefreshDto } from './dto/request/refresh.dto';
import { RegisterDto } from './dto/request/register.dto';
import { LoginResponse } from './dto/response/login.dto';
import { RefreshResponse } from './dto/response/refresh.dto';

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
    ttl: AUTH_THROTTLE_TTL_SECONDS * 1000,
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
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email already in use.' })
  register(
    @Body() dto: RegisterDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponse> {
    return this.authService.register(dto, avatar);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Log in with email and password (clients only)' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts.' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post('moderators/login')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Log in as staff (admin or super_admin only)' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts.' })
  loginModerator(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.loginModerator(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Exchange a refresh token for a new access token' })
  @ApiOkResponse({ type: RefreshResponse })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired or revoked refresh token.',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts.' })
  refresh(@Body() dto: RefreshDto): Promise<RefreshResponse> {
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
