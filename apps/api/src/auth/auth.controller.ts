import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponse } from '../users/dto/response/user.dto';
import { REGISTERABLE_ROLES } from '../users/users.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';
import { LoginResponse } from './dto/response/login.dto';

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
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
