import { errorWith } from '../helpers/error-with';
import { groupRow } from '../helpers/rows';
import { ErrorCode } from '@repo/backend/errors';
import { PERMISSION_GROUPS } from '@repo/backend/core';
import { GroupsRepository } from '../../src/groups/groups.repository';
import { GroupsService } from '../../src/groups/groups.service';
import { UsersService } from '../../src/users/users.service';

const group = groupRow;

describe('GroupsService', () => {
  let service: GroupsService;
  let groupsRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findIdByName: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let usersService: { setGroup: jest.Mock; findById: jest.Mock };

  beforeEach(() => {
    groupsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findIdByName: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    usersService = { setGroup: jest.fn(), findById: jest.fn() };
    service = new GroupsService(
      groupsRepository as unknown as GroupsRepository,
      usersService as unknown as UsersService,
    );
  });

  describe('create', () => {
    it('rejects a duplicate name with conflict', async () => {
      groupsRepository.findIdByName.mockResolvedValue({ id: 'other' });

      await expect(
        service.create({ name: 'Support', permissions: ['users:read'] }),
      ).rejects.toThrow(errorWith(ErrorCode.GROUP_NAME_ALREADY_EXISTS));
      expect(groupsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws missing resource for a missing or soft-deleted group', async () => {
      groupsRepository.findById.mockResolvedValue(null);

      await expect(service.findById('group-1')).rejects.toThrow(
        errorWith(ErrorCode.GROUP_NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    it('throws missing resource for a missing group', async () => {
      groupsRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('group-1', { name: 'New Name' }),
      ).rejects.toThrow(errorWith(ErrorCode.GROUP_NOT_FOUND));
    });

    it('rejects a rename onto an existing name', async () => {
      groupsRepository.findById.mockResolvedValue(group());
      groupsRepository.findIdByName.mockResolvedValue({ id: 'other-group' });

      await expect(
        service.update('group-1', { name: 'Existing Name' }),
      ).rejects.toThrow(errorWith(ErrorCode.GROUP_NAME_ALREADY_EXISTS));
    });
  });

  describe('softDelete', () => {
    it('throws missing resource for a missing group', async () => {
      groupsRepository.softDelete.mockResolvedValue(0);

      await expect(service.softDelete('group-1')).rejects.toThrow(
        errorWith(ErrorCode.GROUP_NOT_FOUND),
      );
    });

    it('throws on an already-deleted group', async () => {
      groupsRepository.softDelete.mockResolvedValue(0);

      await expect(service.softDelete('group-1')).rejects.toThrow(
        errorWith(ErrorCode.GROUP_NOT_FOUND),
      );
    });
  });

  describe('permissionCatalog', () => {
    it('returns PERMISSION_GROUPS', () => {
      expect(service.permissionCatalog()).toBe(PERMISSION_GROUPS);
    });
  });

  describe('assignUser', () => {
    it('404s an unknown group before touching UsersService', async () => {
      groupsRepository.findById.mockResolvedValue(null);

      await expect(service.assignUser('group-1', 'user-1')).rejects.toThrow(
        errorWith(ErrorCode.GROUP_NOT_FOUND),
      );
      expect(usersService.setGroup).not.toHaveBeenCalled();
    });

    it('delegates to setGroup(userId, groupId)', async () => {
      groupsRepository.findById.mockResolvedValue(group());
      usersService.setGroup.mockResolvedValue({ id: 'user-1' });

      await service.assignUser('group-1', 'user-1');

      expect(usersService.setGroup).toHaveBeenCalledWith('user-1', 'group-1');
    });
  });

  describe('unassignUser', () => {
    it('404s when the user is not in that group', async () => {
      groupsRepository.findById.mockResolvedValue(group());
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        group: { id: 'a-different-group' },
      });

      await expect(service.unassignUser('group-1', 'user-1')).rejects.toThrow(
        errorWith(ErrorCode.USER_NOT_IN_GROUP),
      );
      expect(usersService.setGroup).not.toHaveBeenCalled();
    });

    it('calls setGroup(userId, null) when the user is a member', async () => {
      groupsRepository.findById.mockResolvedValue(group());
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        group: { id: 'group-1' },
      });

      await service.unassignUser('group-1', 'user-1');

      expect(usersService.setGroup).toHaveBeenCalledWith('user-1', null);
    });
  });
});
