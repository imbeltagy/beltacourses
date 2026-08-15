import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponse } from '../users/dto/response/user.dto';
import type { PublicUser } from '../users/users.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Always creates an unconfirmed student. No token is issued yet — ' +
      'sessions arrive with the authentication task.',
  })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'Email already in use.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify credentials',
    description:
      'Returns the profile on success. No token, cookie or server-side ' +
      'session yet — this endpoint cannot keep a client logged in.',
  })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({
    description:
      'Invalid email or password. The two are indistinguishable by design.',
  })
  login(@Body() dto: LoginDto): Promise<PublicUser> {
    return this.authService.login(dto);
  }
}
