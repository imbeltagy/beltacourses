import { plainToInstance } from 'class-transformer';
import type { Paginated } from '@repo/backend/pagination';
import { ListUsersResponseDto } from './dto/response/list-users.dto';
import { UserResponseDto } from './dto/response/user.dto';
import type { UserWithRelations } from './users.types';

export class UserMapper {
  static toDto(user: UserWithRelations): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  static toListDto(page: Paginated<UserWithRelations>): ListUsersResponseDto {
    return plainToInstance(ListUsersResponseDto, page, {
      excludeExtraneousValues: true,
    });
  }
}
