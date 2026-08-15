import { Injectable } from '@nestjs/common';
import { Role } from '@repo/db';
import { UsersService } from '../users/users.service';
import type { PublicUser } from '../users/users.types';
import { LoginDto } from './dto/request/login.dto';
import { RegisterDto } from './dto/request/register.dto';

/**
 * Thin on purpose. Neither method issues a token or a session yet — T-004 fills
 * that in, and having the seam here already means it extends this class instead
 * of moving files.
 */
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Registration always produces an unconfirmed student. Privileged accounts are
   * made through `POST /users`, never by what a public caller sends.
   */
  register(dto: RegisterDto): Promise<PublicUser> {
    return this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: Role.student,
      confirmed: false,
    });
  }

  /**
   * Verifies credentials and stops there. Note it does not check `confirmed`:
   * nothing can confirm a user until the email service ships, so gating on it
   * now would lock out every account.
   */
  login(dto: LoginDto): Promise<PublicUser> {
    return this.usersService.verifyCredentials(dto.email, dto.password);
  }
}
