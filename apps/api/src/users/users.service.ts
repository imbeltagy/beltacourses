import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '@repo/service/storage';
import { Gender, Prisma, Role } from '@repo/db';
import { PasswordService } from './password.service';
import { UsersRepository } from './users.repository';
import type { ListUsersResult, PublicUser } from './users.types';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
  confirmed?: boolean;
  bio?: string;
  gender?: Gender;
  date_of_birth?: string;
  avatar_id?: string;
}

/** `null` clears the field; `undefined` leaves it untouched. */
export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: Role;
  confirmed?: boolean;
  bio?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  avatar_id?: string | null;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: Role;
  search?: string;
}

@Injectable()
export class UsersService {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly repository: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly storage: StorageService,
  ) {}

  /**
   * The FK only proves the file row exists. Without this check a client can
   * attach the id of a soft-deleted file and every consumer gets a 404-ing
   * avatar.
   */
  private async assertAvatarExists(avatarId: string): Promise<void> {
    try {
      await this.storage.getById(avatarId);
    } catch (error) {
      // Only a missing file is the caller's fault; anything else is ours.
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Unknown avatar_id');
      }
      throw error;
    }
  }

  /**
   * Compared against when the email is unknown, so that path pays the same
   * bcrypt cost as a wrong password. Hashed through `PasswordService` so the
   * cost factor always matches the configured one, and memoized so only the
   * first such login pays for it.
   */
  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwords.hash(randomUUID());
    return this.dummyHash;
  }

  /**
   * Deliberately counts soft-deleted users: a deleted account's address stays
   * taken forever, so its history can never silently reattach to a different
   * person.
   */
  private async assertEmailFree(email: string, exceptId?: string) {
    const existing = await this.repository.findIdByEmail(email);
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('Email already in use');
    }
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    await this.assertEmailFree(input.email);
    if (input.avatar_id) await this.assertAvatarExists(input.avatar_id);

    return this.repository.create({
      email: input.email,
      name: input.name,
      hashed_password: await this.passwords.hash(input.password),
      role: input.role,
      confirmed: input.confirmed,
      bio: input.bio,
      gender: input.gender,
      date_of_birth: input.date_of_birth
        ? new Date(input.date_of_birth)
        : undefined,
      ...(input.avatar_id
        ? { avatar: { connect: { id: input.avatar_id } } }
        : {}),
    });
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async list(query: ListUsersQuery): Promise<ListUsersResult> {
    const { items, total } = await this.repository.findMany(query);
    return { items, total, page: query.page, limit: query.limit };
  }

  /** Never touches `hashed_password` — a password change belongs to its own flow. */
  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    await this.findById(id);

    if (input.email) await this.assertEmailFree(input.email, id);
    if (input.avatar_id) await this.assertAvatarExists(input.avatar_id);

    const data: Prisma.UserUpdateInput = {
      email: input.email,
      name: input.name,
      role: input.role,
      confirmed: input.confirmed,
      bio: input.bio,
      gender: input.gender,
      date_of_birth:
        input.date_of_birth === undefined
          ? undefined
          : input.date_of_birth === null
            ? null
            : new Date(input.date_of_birth),
    };

    if (input.avatar_id !== undefined) {
      data.avatar =
        input.avatar_id === null
          ? { disconnect: true }
          : { connect: { id: input.avatar_id } };
    }

    return this.repository.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    const changed = await this.repository.softDelete(id);
    if (changed === 0) throw new NotFoundException(`User ${id} not found`);
  }

  /**
   * The only method that reads the hash. Unknown email and wrong password throw
   * the same error, and both walk the same bcrypt comparison, so the endpoint is
   * neither a user-enumeration oracle nor a timing one.
   */
  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    const user = await this.repository.findByEmailWithPassword(email);

    const matches = await this.passwords.compare(
      password,
      user ? user.hashed_password : await this.getDummyHash(),
    );

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Destructured out, not deleted: the two names below are the whole point of
    // the statement, so the rule is disabled rather than the fields renamed.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashed_password, deleted_at, ...publicUser } = user;
    return publicUser;
  }
}
