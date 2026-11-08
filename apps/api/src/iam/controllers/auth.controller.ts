import { ErrorResponseDto } from '@repo/backend/errors';
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
import { CurrentUser } from '../decorators/current-user.decorator';
import type { RequestUser } from '../types/auth.types';
import { UserResponseDto } from '../dto/response/user.dto';
import { AUTH_THROTTLE } from '../constants/auth.constants';
import { UserMapper } from '../mappers/user.mapper';
import { IamFacade } from '../iam.facade';
import { Auth } from '../decorators/auth.decorator';
import { LoginDto } from '../dto/request/login.dto';
import { RefreshDto } from '../dto/request/refresh.dto';
import { RegisterDto } from '../dto/request/register.dto';
import { LoginResponseDto } from '../dto/response/login.dto';
import { RefreshResponseDto } from '../dto/response/refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly iam: IamFacade) {}

  @Post('register')
  @Auth({ public: true })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
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
    const user = await this.iam.register(dto, avatar);
    return UserMapper.toDto(user);
  }

  @Post('login')
  @Auth({ public: true })
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
    return this.iam.login(dto);
  }

  @Post('moderators/login')
  @Auth({ public: true })
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
    return this.iam.loginModerator(dto);
  }

  @Post('refresh')
  @Auth({ public: true })
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
    return this.iam.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(204)
  @Auth({ public: false })
  @ApiOperation({ summary: 'Log out (ends the current session)' })
  @ApiNoContentResponse()
  logout(@CurrentUser() user: RequestUser): Promise<void> {
    return this.iam.logout(user);
  }
}
