import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import type { User } from '@repo/db';
import { StorageService } from '../../../storage/storage.service';
import type { FileToUpload } from '../../../storage/storage.types';
import { UserRepository } from './user.repository';
import type { CreateUserDto } from '../../dto/request/create-user.dto';
import type { ListUsersQueryDto } from '../../dto/request/list-users.dto';
import type { UpdateUserDto } from '../../dto/request/update-user.dto';
import type { Paginated } from '@repo/backend/pagination';
import type { UserWithRelations } from '../../types/auth.types';

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  // FIXME: don't use password service here. also update the existing user with deletedAt with the new details but same password

  async create(
    input: Omit<CreateUserDto, 'password'>,
    hashedPassword: string,
    avatar?: FileToUpload,
  ): Promise<UserWithRelations> {
    const existing = await this.usersRepository.findIdByEmail(input.email);
    if (existing && !existing.deleted_at)
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);

    const uploadedAvatar = avatar
      ? await this.storageService.upload(avatar)
      : undefined;

    const sharedFields = {
      hashed_password: hashedPassword,
      name: input.name,
      role: input.role,
      confirmed: input.confirmed,
      bio: input.bio,
      gender: input.gender,
      date_of_birth: input.date_of_birth
        ? new Date(input.date_of_birth)
        : undefined,
      avatar_id: uploadedAvatar?.id,
    };

    let entity: UserWithRelations;
    try {
      if (existing) {
        entity = await this.usersRepository.update(existing.id, {
          ...sharedFields,
        });

        if (existing.avatar_id)
          await this.storageService
            .softDelete(existing.avatar_id)
            .catch(() => {});
      } else {
        entity = await this.usersRepository.create({
          email: input.email,
          ...sharedFields,
        });
      }
    } catch (error) {
      if (uploadedAvatar)
        await this.storageService.softDelete(uploadedAvatar.id).catch(() => {});

      throw error;
    }

    return entity;
  }

  async findById(id: string): Promise<UserWithRelations> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AppException(ErrorCode.USER_NOT_FOUND);
    return user;
  }

  async list(query: ListUsersQueryDto): Promise<Paginated<UserWithRelations>> {
    const { items, total } = await this.usersRepository.findMany(query);
    return {
      data: items,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async update(
    id: string,
    input: UpdateUserDto,
    avatar?: FileToUpload,
  ): Promise<UserWithRelations> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new AppException(ErrorCode.USER_NOT_FOUND);

    const uploadedAvatar = avatar
      ? await this.storageService.upload(avatar)
      : undefined;

    let updated: UserWithRelations;
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

  findIdsByGroup(groupId: string): Promise<string[]> {
    return this.usersRepository.findIdsByGroup(groupId);
  }

  setGroup(userId: string, groupId: string | null): Promise<UserWithRelations> {
    return this.usersRepository.update(userId, { group_id: groupId });
  }
}
