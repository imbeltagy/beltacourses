import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@repo/db';
import { PasswordService } from '@repo/service/core';
import { UsersRepository } from '../../src/users/users.repository';
import { UsersService } from '../../src/users/users.service';
import { StorageService } from '../../src/storage/storage.service';

const publicUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  email: 'student@beltacourses.com',
  name: 'Jane Doe',
  role: Role.student,
  confirmed: false,
  bio: null,
  gender: null,
  date_of_birth: null,
  avatar_id: null,
  created_at: new Date('2026-08-01T00:00:00.000Z'),
  updated_at: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
});

const avatarFile = () => ({
  buffer: Buffer.from('avatar'),
  originalname: 'avatar.png',
  mimetype: 'image/png',
  size: 1024,
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    create: jest.Mock;
    findById: jest.Mock;
    findIdByEmail: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  let passwordService: { hash: jest.Mock };
  let storageService: { upload: jest.Mock; softDelete: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findIdByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    passwordService = { hash: jest.fn() };
    storageService = {
      upload: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    service = new UsersService(
      repository as unknown as UsersRepository,
      passwordService as unknown as PasswordService,
      storageService as unknown as StorageService,
    );
  });

  describe('create', () => {
    const input = {
      email: 'student@beltacourses.com',
      password: 'plaintext-password',
      name: 'Jane Doe',
      role: Role.student,
      confirmed: false,
    };

    it('hashes the password and never returns it', async () => {
      repository.findIdByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-value');
      repository.create.mockResolvedValue(publicUser());

      const result = await service.create(input);

      expect(passwordService.hash).toHaveBeenCalledWith('plaintext-password');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ hashed_password: 'hashed-value' }),
      );
      expect(result).not.toHaveProperty('hashed_password');
    });

    it('throws 409 when the email is already taken', async () => {
      repository.findIdByEmail.mockResolvedValue({ id: 'other-user' });

      await expect(service.create(input)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('uploads the avatar file and attaches it when provided', async () => {
      repository.findIdByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-value');
      storageService.upload.mockResolvedValue({ id: 'file-1', url: 'url' });
      repository.create.mockResolvedValue(publicUser({ avatar_id: 'file-1' }));

      await service.create(input, avatarFile());

      expect(storageService.upload).toHaveBeenCalledWith(avatarFile());
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatar_id: 'file-1' }),
      );
    });

    it('does not upload anything when no avatar is provided', async () => {
      repository.findIdByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-value');
      repository.create.mockResolvedValue(publicUser());

      await service.create(input);

      expect(storageService.upload).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatar_id: undefined }),
      );
    });

    it('soft-deletes the uploaded avatar when the create fails', async () => {
      repository.findIdByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-value');
      storageService.upload.mockResolvedValue({ id: 'file-1', url: 'url' });
      repository.create.mockRejectedValue(new Error('unique constraint'));

      await expect(service.create(input, avatarFile())).rejects.toThrow(
        'unique constraint',
      );
      expect(storageService.softDelete).toHaveBeenCalledWith('file-1');
    });
  });

  describe('findById', () => {
    it('throws 404 when the user is missing or soft-deleted', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the user when found', async () => {
      const user = publicUser();
      repository.findById.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toBe(user);
    });
  });

  describe('update', () => {
    it('throws 404 when the user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('unknown', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 409 when the new email belongs to another live user', async () => {
      repository.findById.mockResolvedValue(publicUser());
      repository.findIdByEmail.mockResolvedValue({ id: 'someone-else' });

      await expect(
        service.update('user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('allows keeping the same email', async () => {
      repository.findById.mockResolvedValue(publicUser());
      repository.update.mockResolvedValue(publicUser());

      await service.update('user-1', { email: 'student@beltacourses.com' });

      expect(repository.findIdByEmail).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalled();
    });

    it('never writes hashed_password', async () => {
      repository.findById.mockResolvedValue(publicUser());
      repository.update.mockResolvedValue(publicUser());

      await service.update('user-1', { name: 'New Name' });

      const [, data] = repository.update.mock.calls[0] as [
        string,
        Record<string, unknown>,
      ];
      expect(data).not.toHaveProperty('hashed_password');
    });

    it('uploads a new avatar, attaches it, and soft-deletes the previous one', async () => {
      repository.findById.mockResolvedValue(
        publicUser({ avatar_id: 'old-file' }),
      );
      storageService.upload.mockResolvedValue({ id: 'new-file', url: 'url' });
      repository.update.mockResolvedValue(
        publicUser({ avatar_id: 'new-file' }),
      );

      await service.update('user-1', {}, avatarFile());

      expect(storageService.upload).toHaveBeenCalledWith(avatarFile());
      expect(repository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ avatar_id: 'new-file' }),
      );
      expect(storageService.softDelete).toHaveBeenCalledWith('old-file');
    });

    it('does not soft-delete anything when there was no previous avatar', async () => {
      repository.findById.mockResolvedValue(publicUser({ avatar_id: null }));
      storageService.upload.mockResolvedValue({ id: 'new-file', url: 'url' });
      repository.update.mockResolvedValue(
        publicUser({ avatar_id: 'new-file' }),
      );

      await service.update('user-1', {}, avatarFile());

      expect(storageService.softDelete).not.toHaveBeenCalled();
    });

    it('does not upload or touch the avatar when none is provided', async () => {
      repository.findById.mockResolvedValue(
        publicUser({ avatar_id: 'old-file' }),
      );
      repository.update.mockResolvedValue(publicUser());

      await service.update('user-1', { name: 'New Name' });

      expect(storageService.upload).not.toHaveBeenCalled();
      expect(storageService.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes the newly uploaded avatar when the update fails', async () => {
      repository.findById.mockResolvedValue(publicUser());
      storageService.upload.mockResolvedValue({ id: 'new-file', url: 'url' });
      repository.update.mockRejectedValue(new Error('unique constraint'));

      await expect(service.update('user-1', {}, avatarFile())).rejects.toThrow(
        'unique constraint',
      );
      expect(storageService.softDelete).toHaveBeenCalledWith('new-file');
    });
  });

  describe('softDelete', () => {
    it('throws 404 when nothing transitioned', async () => {
      repository.softDelete.mockResolvedValue(0);

      await expect(service.softDelete('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves when the row transitioned', async () => {
      repository.softDelete.mockResolvedValue(1);

      await expect(service.softDelete('user-1')).resolves.toBeUndefined();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('delegates straight to the repository', async () => {
      const row = { ...publicUser(), hashed_password: 'hashed-value' };
      repository.findByEmailWithPassword.mockResolvedValue(row);

      await expect(
        service.findByEmailWithPassword('student@beltacourses.com'),
      ).resolves.toBe(row);
      expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(
        'student@beltacourses.com',
      );
    });

    it('returns null when no live user matches', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.findByEmailWithPassword('unknown@example.com'),
      ).resolves.toBeNull();
    });
  });
});
