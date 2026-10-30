import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { PasswordService, SessionService } from '@repo/backend/core';
import { Role, type User } from '@repo/db';
import type { EmailLocale } from '@repo/backend/email';
import { StorageService } from '../storage/storage.service';
import type { FileToUpload } from '../storage/storage.types';
import { AccountEmailsService } from './account-emails.service';
import { UsersRepository } from './users.repository';
import type { CreateUserDto } from './dto/request/create-user.dto';
import type { ListUsersQueryDto } from './dto/request/list-users.dto';
import type { UpdateUserDto } from './dto/request/update-user.dto';
import type { ListUsersResult, PublicUser } from './users.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly storageService: StorageService,
    private readonly sessionService: SessionService,
    private readonly accountEmails: AccountEmailsService,
  ) {}

  async create(
    input: CreateUserDto,
    avatar?: FileToUpload,
    /** Set by callers where staff create the account: the new user is emailed in this language. */
    welcomeLocale?: EmailLocale,
  ): Promise<PublicUser> {
    const existing = await this.usersRepository.findIdByEmail(input.email);
    if (existing) throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);

    const hashed_password = await this.passwordService.hash(input.password);
    const uploadedAvatar = avatar
      ? await this.storageService.upload(avatar)
      : undefined;

    let created: PublicUser;
    try {
      created = await this.usersRepository.create({
        email: input.email,
        hashed_password,
        name: input.name,
        role: input.role,
        confirmed: input.confirmed,
        bio: input.bio,
        gender: input.gender,
        date_of_birth: input.date_of_birth
          ? new Date(input.date_of_birth)
          : undefined,
        avatar_id: uploadedAvatar?.id,
      });
    } catch (error) {
      if (uploadedAvatar) {
        await this.storageService.softDelete(uploadedAvatar.id).catch(() => {});
      }
      throw error;
    }

    if (welcomeLocale) {
      await this.accountEmails.sendAccountCreated(created, welcomeLocale);
    }
    return created;
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AppException(ErrorCode.USER_NOT_FOUND);
    return user;
  }

  async list(query: ListUsersQueryDto): Promise<ListUsersResult> {
    return this.usersRepository.findMany(query).then(({ items, total }) => ({
      items,
      total,
      page: query.page,
      limit: query.limit,
    }));
  }

  async update(
    id: string,
    input: UpdateUserDto,
    avatar?: FileToUpload,
  ): Promise<PublicUser> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new AppException(ErrorCode.USER_NOT_FOUND);

    const uploadedAvatar = avatar
      ? await this.storageService.upload(avatar)
      : undefined;

    let updated: PublicUser;
    try {
      updated = await this.usersRepository.update(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.confirmed !== undefined
          ? { confirmed: input.confirmed }
          : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.date_of_birth !== undefined
          ? {
              date_of_birth: input.date_of_birth
                ? new Date(input.date_of_birth)
                : null,
            }
          : {}),
        ...(uploadedAvatar ? { avatar_id: uploadedAvatar.id } : {}),
      });
    } catch (error) {
      if (uploadedAvatar) {
        await this.storageService.softDelete(uploadedAvatar.id).catch(() => {});
      }
      throw error;
    }

    if (uploadedAvatar && existing.avatar?.id) {
      await this.storageService.softDelete(existing.avatar.id).catch(() => {});
    }

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const changed = await this.usersRepository.softDelete(id);
    if (changed === 0) throw new AppException(ErrorCode.USER_NOT_FOUND);
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async setGroup(userId: string, groupId: string | null): Promise<PublicUser> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new AppException(ErrorCode.USER_NOT_FOUND);

    if (user.role !== Role.admin) {
      throw new AppException(ErrorCode.ONLY_ADMIN_CAN_HAVE_GROUP);
    }

    const updated = await this.usersRepository.update(userId, {
      group_id: groupId,
    });

    await this.sessionService.removeAllUserSessions(userId);

    return updated;
  }
}
