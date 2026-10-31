import { errorWith } from '../helpers/error-with';
import { groupRow } from '../helpers/rows';
import { ErrorCode } from '@repo/backend/errors';
import { PERMISSION_GROUPS } from '@repo/backend/core';
import { GroupsRepository } from '../../src/groups/groups.repository';
import { GroupsService } from '../../src/groups/groups.service';

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

  beforeEach(() => {
    groupsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findIdByName: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    service = new GroupsService(
      groupsRepository as unknown as GroupsRepository,
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
});
