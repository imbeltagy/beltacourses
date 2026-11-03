import { errorWith } from '../helpers/error-with';
import { userRow } from '../helpers/rows';
import { AppException, ErrorCode } from '@repo/backend/errors';
import { Role } from '@repo/db';
import { IamFacade } from '../../src/iam/iam.facade';
import type { SessionService } from '../../src/iam/auth/session.service';
import type { AuthService } from '../../src/iam/auth/auth.service';
import type { UserService } from '../../src/iam/user/user.service';
import type { GroupsService } from '../../src/iam/groups/groups.service';
import type { AccountEmailsService } from '../../src/email/account-emails.service';

const user = (overrides: Partial<Record<string, unknown>> = {}) => ({
  ...userRow(),
  ...overrides,
});

describe('IamFacade', () => {
  let facade: IamFacade;
  let authService: {
    login: jest.Mock;
    verifyPassword: jest.Mock;
    verifyRefreshToken: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };
  let sessionService: { remove: jest.Mock; removeAllForUser: jest.Mock };
  let userService: {
    create: jest.Mock;
    findById: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    setGroup: jest.Mock;
  };
  let groupsService: { findById: jest.Mock; findPermissions: jest.Mock };
  let accountEmails: { sendAccountCreated: jest.Mock };

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      verifyPassword: jest.fn().mockResolvedValue(undefined),
      verifyRefreshToken: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    sessionService = {
      remove: jest.fn().mockResolvedValue(undefined),
      removeAllForUser: jest.fn().mockResolvedValue(0),
    };
    userService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      setGroup: jest.fn(),
    };
    groupsService = {
      findById: jest.fn().mockResolvedValue({ id: 'group-1' }),
      findPermissions: jest.fn().mockResolvedValue(['users:read']),
    };
    accountEmails = {
      sendAccountCreated: jest.fn().mockResolvedValue(undefined),
    };

    facade = new IamFacade(
      authService as unknown as AuthService,
      sessionService as unknown as SessionService,
      userService as unknown as UserService,
      groupsService as unknown as GroupsService,
      accountEmails as unknown as AccountEmailsService,
    );
  });

  describe('register', () => {
    it('forces confirmed: false and passes the chosen role through', async () => {
      userService.create.mockResolvedValue({ id: 'user-1' });

      await facade.register({
        email: 'a@example.com',
        password: 'password',
        name: 'A',
        role: Role.teacher,
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.teacher, confirmed: false }),
        undefined,
      );
    });

    it('ignores a smuggled confirmed: true on the body', async () => {
      userService.create.mockResolvedValue({ id: 'user-1' });

      await facade.register({
        email: 'a@example.com',
        password: 'password',
        name: 'A',
        role: Role.student,
        confirmed: true,
      } as never);

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ confirmed: false }),
        undefined,
      );
    });

    it('forwards the uploaded avatar file to UserService', async () => {
      userService.create.mockResolvedValue({ id: 'user-1' });
      const avatar = { originalname: 'avatar.png' } as Express.Multer.File;

      await facade.register(
        {
          email: 'a@example.com',
          password: 'password',
          name: 'A',
          role: Role.student,
        },
        avatar,
      );

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@example.com' }),
        avatar,
      );
    });

    it('sends no email (self-registration)', async () => {
      userService.create.mockResolvedValue({ id: 'user-1' });

      await facade.register({
        email: 'a@example.com',
        password: 'password',
        name: 'A',
        role: Role.student,
      });

      expect(accountEmails.sendAccountCreated).not.toHaveBeenCalled();
    });
  });

  describe('login / loginModerator', () => {
    const dto = { email: 'student@beltacourses.com', password: 'password' };

    it('checks the hash, loads the public profile and issues a client pair', async () => {
      userService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      const profile = user();
      userService.findById.mockResolvedValue(profile);
      authService.login.mockResolvedValue({ access_token: 'a' });

      await expect(facade.login(dto)).resolves.toEqual({ access_token: 'a' });
      expect(authService.verifyPassword).toHaveBeenCalledWith(
        'password',
        'hashed-value',
      );
      expect(authService.login).toHaveBeenCalledWith(profile, 'client', []);
    });

    it('loginModerator issues with the moderator flag', async () => {
      userService.findByEmailWithPassword.mockResolvedValue({
        id: 'admin-1',
        hashed_password: 'hashed-value',
      });
      const profile = user({ role: Role.admin, group_id: 'group-1' });
      userService.findById.mockResolvedValue(profile);
      authService.login.mockResolvedValue({ access_token: 'a' });

      await facade.loginModerator(dto);

      expect(authService.login).toHaveBeenCalledWith(profile, 'moderator', [
        'users:read',
      ]);
    });

    it('gives an admin with no group no permissions', async () => {
      userService.findByEmailWithPassword.mockResolvedValue({
        id: 'admin-1',
        hashed_password: 'hashed-value',
      });
      const profile = user({ role: Role.admin, group_id: null });
      userService.findById.mockResolvedValue(profile);

      await facade.loginModerator(dto);

      expect(groupsService.findPermissions).not.toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith(profile, 'moderator', []);
    });

    it('throws the same 401 for an unknown email', async () => {
      userService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(facade.login(dto)).rejects.toThrow(
        errorWith(ErrorCode.INVALID_CREDENTIALS),
      );
      expect(authService.verifyPassword).not.toHaveBeenCalled();
    });

    it('stops at a wrong password without loading the profile', async () => {
      userService.findByEmailWithPassword.mockResolvedValue({
        id: 'user-1',
        hashed_password: 'hashed-value',
      });
      authService.verifyPassword.mockRejectedValue(
        new AppException(ErrorCode.INVALID_CREDENTIALS),
      );

      await expect(facade.login(dto)).rejects.toThrow(
        errorWith(ErrorCode.INVALID_CREDENTIALS),
      );
      expect(userService.findById).not.toHaveBeenCalled();
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const claims = { sid: 'sid-1', userId: 'user-1' };

    it('loads the user and permissions, then hands over to AuthService', async () => {
      const profile = user({ role: Role.admin, group_id: 'group-1' });
      authService.verifyRefreshToken.mockReturnValue(claims);
      userService.findById.mockResolvedValue(profile);
      authService.refresh.mockResolvedValue({ access_token: 'new' });

      await expect(facade.refresh('a-refresh-token')).resolves.toEqual({
        access_token: 'new',
      });
      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(groupsService.findPermissions).toHaveBeenCalledWith('group-1');
      expect(authService.refresh).toHaveBeenCalledWith(
        claims,
        'a-refresh-token',
        profile,
        ['users:read'],
      );
    });

    it('passes no permissions for a client', async () => {
      const profile = user();
      authService.verifyRefreshToken.mockReturnValue(claims);
      userService.findById.mockResolvedValue(profile);

      await facade.refresh('a-refresh-token');

      expect(groupsService.findPermissions).not.toHaveBeenCalled();
      expect(authService.refresh).toHaveBeenCalledWith(
        claims,
        'a-refresh-token',
        profile,
        [],
      );
    });

    it('removes the session and 401s a soft-deleted or unknown user', async () => {
      authService.verifyRefreshToken.mockReturnValue(claims);
      userService.findById.mockRejectedValue(
        new AppException(ErrorCode.USER_NOT_FOUND),
      );

      await expect(facade.refresh('a-refresh-token')).rejects.toThrow(
        errorWith(ErrorCode.INVALID_REFRESH_TOKEN),
      );
      expect(sessionService.remove).toHaveBeenCalledWith('sid-1', 'user-1');
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('lets other lookup failures through', async () => {
      authService.verifyRefreshToken.mockReturnValue(claims);
      userService.findById.mockRejectedValue(new Error('db down'));

      await expect(facade.refresh('a-refresh-token')).rejects.toThrow(
        'db down',
      );
      expect(sessionService.remove).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('delegates to AuthService', async () => {
      authService.logout.mockResolvedValue(undefined);
      const principal = {
        id: 'admin-1',
        email: 'a@example.com',
        name: 'A',
        role: Role.admin,
        sid: 'sid-1',
        groupId: null,
        permissions: [],
      };

      await facade.logout(principal);

      expect(authService.logout).toHaveBeenCalledWith(principal);
    });
  });

  describe('createUser', () => {
    const dto = {
      email: 'student@beltacourses.com',
      password: 'plaintext-password',
      name: 'Jane Doe',
      role: Role.student,
    } as never;

    it('creates the user, then emails them in the given locale', async () => {
      userService.create.mockResolvedValue(user());

      await facade.createUser(dto, undefined, 'ar');

      expect(userService.create).toHaveBeenCalledWith(dto, undefined);
      expect(accountEmails.sendAccountCreated).toHaveBeenCalledWith(
        user(),
        'ar',
      );
    });

    it('sends no email when creating fails', async () => {
      userService.create.mockRejectedValue(
        new AppException(ErrorCode.EMAIL_ALREADY_EXISTS),
      );

      await expect(facade.createUser(dto, undefined, 'en')).rejects.toThrow();
      expect(accountEmails.sendAccountCreated).not.toHaveBeenCalled();
    });
  });

  describe('assignGroup', () => {
    it('404s an unknown user before checking the group', async () => {
      userService.findById.mockRejectedValue(
        new AppException(ErrorCode.USER_NOT_FOUND),
      );

      await expect(facade.assignGroup('unknown', 'group-1')).rejects.toThrow(
        errorWith(ErrorCode.USER_NOT_FOUND),
      );
      expect(groupsService.findById).not.toHaveBeenCalled();
      expect(sessionService.removeAllForUser).not.toHaveBeenCalled();
    });

    it('rejects a non-admin target with bad request', async () => {
      userService.findById.mockResolvedValue(user({ role: Role.teacher }));

      await expect(facade.assignGroup('user-1', 'group-1')).rejects.toThrow(
        errorWith(ErrorCode.ONLY_ADMIN_CAN_HAVE_GROUP),
      );
      expect(groupsService.findById).not.toHaveBeenCalled();
      expect(userService.setGroup).not.toHaveBeenCalled();
    });

    it('propagates an unknown group without writing', async () => {
      userService.findById.mockResolvedValue(user({ role: Role.admin }));
      groupsService.findById.mockRejectedValue(
        new AppException(ErrorCode.GROUP_NOT_FOUND),
      );

      await expect(facade.assignGroup('user-1', 'group-1')).rejects.toThrow(
        errorWith(ErrorCode.GROUP_NOT_FOUND),
      );
      expect(userService.setGroup).not.toHaveBeenCalled();
      expect(sessionService.removeAllForUser).not.toHaveBeenCalled();
    });

    it('links the group after checking it exists', async () => {
      userService.findById.mockResolvedValue(user({ role: Role.admin }));
      userService.setGroup.mockResolvedValue(user({ role: Role.admin }));

      await facade.assignGroup('user-1', 'group-1');

      expect(groupsService.findById).toHaveBeenCalledWith('group-1');
      expect(userService.setGroup).toHaveBeenCalledWith('user-1', 'group-1');
    });

    it('revokes sessions after the write, not before', async () => {
      userService.findById.mockResolvedValue(user({ role: Role.admin }));
      const callOrder: string[] = [];
      userService.setGroup.mockImplementation(() => {
        callOrder.push('setGroup');
        return Promise.resolve(user({ role: Role.admin }));
      });
      sessionService.removeAllForUser.mockImplementation(() => {
        callOrder.push('revokeAllSessions');
        return Promise.resolve(1);
      });

      await facade.assignGroup('user-1', 'group-1');

      expect(callOrder).toEqual(['setGroup', 'revokeAllSessions']);
    });

    it('propagates a session revocation failure', async () => {
      userService.findById.mockResolvedValue(user({ role: Role.admin }));
      userService.setGroup.mockResolvedValue(user({ role: Role.admin }));
      sessionService.removeAllForUser.mockRejectedValue(
        new Error('ECONNREFUSED'),
      );

      await expect(facade.assignGroup('user-1', 'group-1')).rejects.toThrow(
        'ECONNREFUSED',
      );
    });
  });
});
