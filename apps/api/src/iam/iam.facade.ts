import { Injectable } from '@nestjs/common';
import { AppException, ErrorCode } from '@repo/backend/errors';
import type { EmailLocale } from '@repo/backend/email';
import type { Paginated } from '@repo/backend/pagination';
import { Role } from '@repo/db';
import { AccountEmailsService } from '../email/account-emails.service';
import type { FileToUpload } from '../storage/storage.types';
import { AuthService } from './modules/auth/auth.service';
import { SessionService } from './modules/auth/session.service';
import { GroupsService } from './modules/groups/groups.service';
import { UserService } from './modules/user/user.service';
import type { CreateGroupDto } from './dto/request/create-group.dto';
import type { CreateUserDto } from './dto/request/create-user.dto';
import type { ListGroupsQueryDto } from './dto/request/list-groups.dto';
import type { ListUsersQueryDto } from './dto/request/list-users.dto';
import type { LoginDto } from './dto/request/login.dto';
import type { RegisterDto } from './dto/request/register.dto';
import type { UpdateGroupDto } from './dto/request/update-group.dto';
import type { UpdateUserDto } from './dto/request/update-user.dto';
import type { LoginResponseDto } from './dto/response/login.dto';
import type { PermissionCatalogResponse } from './dto/response/permission-catalog.dto';
import type { RefreshResponseDto } from './dto/response/refresh.dto';
import type {
  AuthKind,
  GroupWithRelations,
  RequestUser,
  UserWithRelations,
} from './types/iam.types';

/**
 * The only entry point controllers use. Holds every rule that spans more
 * than one sub-service; the sub-services never inject each other.
 */
@Injectable()
export class IamFacade {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
    private readonly groupsService: GroupsService,
    private readonly accountEmails: AccountEmailsService,
  ) {}

  // ---- auth ----

  register(
    dto: RegisterDto,
    avatar?: FileToUpload,
  ): Promise<UserWithRelations> {
    return this.userService.create(
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
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    return this.signIn(dto, 'client');
  }

  /** POST /auth/moderators/login — staff only. */
  async loginModerator(dto: LoginDto): Promise<LoginResponseDto> {
    return this.signIn(dto, 'moderator');
  }

  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    const claims = this.authService.verifyRefreshToken(refreshToken);

    let user: UserWithRelations;
    try {
      user = await this.userService.findById(claims.userId);
    } catch (error) {
      if (
        error instanceof AppException &&
        error.error === ErrorCode.USER_NOT_FOUND
      ) {
        // Deleted since login: the session must not outlive the account.
        await this.sessionService.remove(claims.sid, claims.userId);
        throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
      }
      throw error;
    }

    const permissions = await this.loadPermissions(user);
    return this.authService.refresh(claims, refreshToken, user, permissions);
  }

  logout(user: RequestUser): Promise<void> {
    return this.authService.logout(user);
  }

  private async signIn(
    dto: LoginDto,
    kind: AuthKind,
  ): Promise<LoginResponseDto> {
    const user = await this.verifyCredentials(dto.email, dto.password);
    const permissions = await this.loadPermissions(user);
    return this.authService.login(user, kind, permissions);
  }

  /** An admin's group permissions; every other role has none. */
  private async loadPermissions(user: UserWithRelations): Promise<string[]> {
    if (user.role !== Role.admin || !user.group_id) return [];
    return this.groupsService.findPermissions(user.group_id);
  }

  private async verifyCredentials(
    email: string,
    password: string,
  ): Promise<UserWithRelations> {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new AppException(ErrorCode.INVALID_CREDENTIALS);

    await this.authService.verifyPassword(password, user.hashed_password);

    return this.userService.findById(user.id);
  }

  // ---- users ----

  /** Staff-created account: the new user is emailed in `locale`. */
  async createUser(
    dto: CreateUserDto,
    avatar: FileToUpload | undefined,
    locale: EmailLocale,
  ): Promise<UserWithRelations> {
    const user = await this.userService.create(dto, avatar);
    await this.accountEmails.sendAccountCreated(user, locale);
    return user;
  }

  listUsers(query: ListUsersQueryDto): Promise<Paginated<UserWithRelations>> {
    return this.userService.list(query);
  }

  getUser(id: string): Promise<UserWithRelations> {
    return this.userService.findById(id);
  }

  updateUser(
    id: string,
    dto: UpdateUserDto,
    avatar?: FileToUpload,
  ): Promise<UserWithRelations> {
    return this.userService.update(id, dto, avatar);
  }

  /** Soft delete also ends every live session of the user. */
  async deleteUser(id: string): Promise<void> {
    await this.userService.softDelete(id);
    await this.sessionService.removeAllForUser(id);
  }

  // TODO(T-018): reset-password must call SessionService.removeAllForUser(userId) after changing the password

  /** Ends the admin's live sessions so their permissions refresh. */
  async assignGroup(
    userId: string,
    groupId: string,
  ): Promise<UserWithRelations> {
    const user = await this.userService.findById(userId);

    if (user.role !== Role.admin) {
      throw new AppException(ErrorCode.ONLY_ADMIN_CAN_HAVE_GROUP);
    }

    await this.groupsService.findById(groupId);

    const updated = await this.userService.setGroup(userId, groupId);

    await this.sessionService.removeAllForUser(userId);

    return updated;
  }

  /** Clears the admin's group and ends their live sessions. */
  async unassignGroup(userId: string): Promise<void> {
    await this.userService.findById(userId);
    await this.userService.setGroup(userId, null);
    await this.sessionService.removeAllForUser(userId);
  }

  // ---- groups ----

  permissionCatalog(): PermissionCatalogResponse {
    return this.groupsService.permissionCatalog();
  }

  createGroup(dto: CreateGroupDto): Promise<GroupWithRelations> {
    return this.groupsService.create(dto);
  }

  listGroups(
    query: ListGroupsQueryDto,
  ): Promise<Paginated<GroupWithRelations>> {
    return this.groupsService.list(query);
  }

  getGroup(id: string): Promise<GroupWithRelations> {
    return this.groupsService.findById(id);
  }

  /** A permissions change ends the sessions of every member of the group. */
  async updateGroup(
    id: string,
    dto: UpdateGroupDto,
  ): Promise<GroupWithRelations> {
    const updated = await this.groupsService.update(id, dto);

    if (dto.permissions !== undefined) {
      const memberIds = await this.userService.findIdsByGroup(id);
      await this.sessionService.removeAllForUsers(memberIds);
    }

    return updated;
  }

  /** Members are read before the delete: the FK then nulls their group_id. */
  async deleteGroup(id: string): Promise<void> {
    const memberIds = await this.userService.findIdsByGroup(id);
    await this.groupsService.delete(id);
    await this.sessionService.removeAllForUsers(memberIds);
  }
}
