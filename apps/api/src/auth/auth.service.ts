import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordService, TokenService } from '@repo/service/core';
import type { FileToUpload } from '../storage/storage.types';
import type { PublicUser } from '../users/users.types';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/request/login.dto';
import type { RegisterDto } from './dto/request/register.dto';
import type { LoginResponse } from './dto/response/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  register(dto: RegisterDto, avatar?: FileToUpload): Promise<PublicUser> {
    return this.usersService.create(
      {
        email: dto.email,
        password: dto.password,
        name: dto.name,
        role: dto.role,
        confirmed: false,
      },
      avatar,
    );
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    return { access_token: this.tokenService.sign(user.id) };
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await this.passwordService.compare(
      password,
      user.hashed_password,
    );
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.usersService.findById(user.id);
  }
}
