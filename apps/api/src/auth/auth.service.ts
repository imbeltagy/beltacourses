import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { randomUUID } from 'node:crypto';
import {
  isModerator,
  PasswordService,
  SessionService,
  TokenService,
} from '@repo/backend/core';
import type { RequestUser, TokenUser } from '@repo/backend/core';
import type { FileToUpload } from '../storage/storage.types';
import type { PublicUser } from '../users/users.types';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/request/login.dto';
import type { RegisterDto } from './dto/request/register.dto';
import type { LoginResponse } from './dto/response/login.dto';
import type { RefreshResponse } from './dto/response/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
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

  /** POST /auth/login — clients only. */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    return this.issueTokens(user, false);
  }

  /** POST /auth/moderators/login — staff only. Creates the Redis session. */
  async loginModerator(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    return this.issueTokens(user, true);
  }

  /**
   * Shared by both login endpoints. Same generic 401 as a wrong password on
   * a role mismatch, so neither endpoint reveals whether an address is staff.
   */
  private async issueTokens(
    user: PublicUser,
    expectModerator: boolean,
  ): Promise<LoginResponse> {
    if (isModerator(user.role) !== expectModerator) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    if (!expectModerator) {
      return this.tokenService.signPair(tokenUser);
    }

    // The sid must exist before the refresh token is signed — it is a claim inside it.
    const sid = randomUUID();
    const refresh_token = this.tokenService.signRefreshToken(tokenUser, sid);
    // If this throws (Redis down), the login fails with a 503; no token is
    // handed out. Never fall back to a session-less moderator token.
    await this.sessionService.saveSession(user.id, sid, refresh_token);
    const access_token = this.tokenService.signAccessToken(tokenUser, sid);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: this.tokenService.accessTokenTtl(user.role),
    };
  }

  /** POST /auth/refresh — both role groups. */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const claims = this.tokenService.verifyRefreshToken(refreshToken);

    let user: PublicUser;
    try {
      user = await this.usersService.findById(claims.sub);
    } catch (error) {
      if (
        error instanceof AppException &&
        error.error === ErrorCode.USER_NOT_FOUND
      ) {
        throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
      }
      throw error;
    }

    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Branch on the current DB role, not the role inside the token.
    if (isModerator(user.role)) {
      if (!claims.sid) throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);

      const ok = await this.sessionService.verifySession(
        user.id,
        claims.sid,
        refreshToken,
      );
      if (!ok) throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);

      return {
        access_token: this.tokenService.signAccessToken(tokenUser, claims.sid),
        token_type: 'Bearer',
        expires_in: this.tokenService.accessTokenTtl(user.role),
      };
    }

    return {
      access_token: this.tokenService.signAccessToken(tokenUser),
      token_type: 'Bearer',
      expires_in: this.tokenService.accessTokenTtl(user.role),
    };
  }

  /** POST /auth/logout — kills the Redis session for a moderator; no-op for a client. */
  async logout(user: RequestUser): Promise<void> {
    if (!user.sid) return;
    await this.sessionService.removeSession(user.id, user.sid);
  }

  /** Called by UsersService when an admin's group changes. */
  revokeAllSessions(userId: string): Promise<number> {
    return this.sessionService.removeAllUserSessions(userId);
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) throw new AppException(ErrorCode.INVALID_CREDENTIALS);

    const valid = await this.passwordService.compare(
      password,
      user.hashed_password,
    );
    if (!valid) throw new AppException(ErrorCode.INVALID_CREDENTIALS);

    return this.usersService.findById(user.id);
  }
}
