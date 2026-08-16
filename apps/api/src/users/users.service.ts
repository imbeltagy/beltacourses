import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '@repo/service/storage';
import type { FileToUpload } from '@repo/service/storage';
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

/**
 * `null` clears the field; `undefined` leaves it untouched.
 *
 * No `role`: it is chosen at creation and immutable afterwards.
 */
export interface UpdateUserInput {
  email?: string;
  name?: string;
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

/** Postgres names the email index this; it is what a driver-level error reports. */
const EMAIL_UNIQUE_INDEX = 'users_email_key';

interface UniqueViolationMeta {
  /** Classic query-engine shape. */
  target?: string | string[];
  /** Driver-adapter shape — what `@prisma/adapter-pg` actually produces. */
  driverAdapterError?: {
    cause?: { constraint?: { fields?: string[]; index?: string } };
  };
}

/**
 * Which columns a P2002 was raised on. Both shapes are read on purpose: the
 * driver adapter reports the constraint under `driverAdapterError` and leaves
 * `meta.target` undefined, so checking only the classic shape silently lets
 * every real violation through as a 500.
 */
const uniqueViolationNames = (meta: UniqueViolationMeta = {}): string[] => {
  const constraint = meta.driverAdapterError?.cause?.constraint;
  if (constraint?.fields) return constraint.fields;
  if (constraint?.index) return [constraint.index];
  if (Array.isArray(meta.target)) return meta.target;
  if (typeof meta.target === 'string') return [meta.target];
  return [];
};

/**
 * A duplicate email specifically — a future unique index on another column
 * keeps reporting its own error rather than being mislabelled.
 */
const isEmailUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' &&
  uniqueViolationNames(error.meta as UniqueViolationMeta | undefined).some(
    (name) => name === 'email' || name === EMAIL_UNIQUE_INDEX,
  );

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
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
   * Turns whichever way the caller supplied an avatar into an id.
   *
   * `uploaded` tells the caller whether this run created a file, so a failure
   * further down can take it back out again — the row is only worth keeping if
   * a user ends up pointing at it.
   */
  private async resolveAvatar(
    avatarId: string | null | undefined,
    file: FileToUpload | undefined,
  ): Promise<{ id?: string | null; uploaded: boolean }> {
    if (file && avatarId !== undefined) {
      throw new BadRequestException(
        'Send either avatar or avatar_id, not both',
      );
    }

    if (file) {
      const { id } = await this.storage.upload(file);
      return { id, uploaded: true };
    }

    if (avatarId) await this.assertAvatarExists(avatarId);
    return { id: avatarId, uploaded: false };
  }

  /**
   * Compensating delete for an avatar whose user never made it into the
   * database. Best-effort and never masks the original failure: the caller is
   * already throwing, and a leftover file is a smaller problem than losing the
   * reason the write failed.
   */
  private async discardUpload(id: string): Promise<void> {
    await this.storage.softDelete(id).catch((error) => {
      this.logger.error(`Orphaned avatar file left behind at ${id}`, error);
    });
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

  /**
   * The check above is a read followed by a write, so two requests for the same
   * address can both pass it. The unique index — which spans soft-deleted rows —
   * is what actually enforces uniqueness; this turns the loser's constraint
   * violation into the same 409 the check would have produced, instead of a 500.
   */
  private async conflictOnDuplicateEmail<T>(write: () => Promise<T>) {
    try {
      return await write();
    } catch (error) {
      if (isEmailUniqueViolation(error)) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async create(
    input: CreateUserInput,
    avatar?: FileToUpload,
  ): Promise<PublicUser> {
    await this.assertEmailFree(input.email);

    const resolved = await this.resolveAvatar(input.avatar_id, avatar);
    const hashed_password = await this.passwords.hash(input.password);

    try {
      return await this.conflictOnDuplicateEmail(() =>
        this.repository.create({
          email: input.email,
          name: input.name,
          hashed_password,
          role: input.role,
          confirmed: input.confirmed,
          bio: input.bio,
          gender: input.gender,
          date_of_birth: input.date_of_birth
            ? new Date(input.date_of_birth)
            : undefined,
          ...(resolved.id ? { avatar: { connect: { id: resolved.id } } } : {}),
        }),
      );
    } catch (error) {
      // Losing the duplicate-email race here is routine, so an avatar uploaded
      // for a user that was never created must not be left behind.
      if (resolved.uploaded && resolved.id)
        await this.discardUpload(resolved.id);
      throw error;
    }
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

  /**
   * Never touches `hashed_password` or `role` — a password change needs the
   * current password, and a role change is a privileged act of its own.
   */
  async update(
    id: string,
    input: UpdateUserInput,
    avatar?: FileToUpload,
  ): Promise<PublicUser> {
    await this.findById(id);

    if (input.email) await this.assertEmailFree(input.email, id);
    const resolved = await this.resolveAvatar(input.avatar_id, avatar);

    const data: Prisma.UserUpdateInput = {
      email: input.email,
      name: input.name,
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

    if (resolved.id !== undefined) {
      data.avatar =
        resolved.id === null
          ? { disconnect: true }
          : { connect: { id: resolved.id } };
    }

    try {
      return await this.conflictOnDuplicateEmail(() =>
        this.repository.update(id, data),
      );
    } catch (error) {
      if (resolved.uploaded && resolved.id)
        await this.discardUpload(resolved.id);
      throw error;
    }
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
