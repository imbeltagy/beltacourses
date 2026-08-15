import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '@repo/service/storage';
import { Prisma, Role, User } from '@repo/db';
import { PasswordService } from '../../src/users/password.service';
import { UsersRepository } from '../../src/users/users.repository';
import { UsersService } from '../../src/users/users.service';
import type { PublicUser } from '../../src/users/users.types';

const publicUser = (overrides: Partial<PublicUser> = {}): PublicUser =>
  ({
    id: 'user-id',
    email: 'jane@example.com',
    name: 'Jane',
    role: Role.student,
    confirmed: false,
    bio: null,
    gender: null,
    date_of_birth: null,
    avatar_id: null,
    created_at: new Date('2026-08-01T00:00:00.000Z'),
    updated_at: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  }) as PublicUser;

/**
 * What Prisma actually throws when a write loses to a unique index, captured
 * from a real Postgres run: the pg driver adapter reports the constraint under
 * `driverAdapterError` and leaves `meta.target` undefined.
 */
const uniqueViolation = (column: string) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: {
      modelName: 'User',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          originalCode: '23505',
          kind: 'UniqueConstraintViolation',
          constraint: { fields: [column] },
        },
      },
    },
  });

/** Same, but the driver names the index instead of listing the columns. */
const uniqueViolationByIndex = (index: string) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: {
      modelName: 'User',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          originalCode: '23505',
          kind: 'UniqueConstraintViolation',
          constraint: { index },
        },
      },
    },
  });

/** The pre-adapter shape, still produced by the query engine on some paths. */
const legacyUniqueViolation = (column: string) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: [column] },
  });

/** Jest types `mock.calls` as `any[][]`; this keeps the assertions type-safe. */
const argsOf = (mock: jest.Mock): unknown[][] => mock.mock.calls as unknown[][];

const argOf = (mock: jest.Mock, call: number, index: number) =>
  argsOf(mock)[call][index] as Record<string, unknown>;

const storedUser = (overrides: Partial<User> = {}): User =>
  ({
    ...publicUser(),
    hashed_password: 'stored-hash',
    deleted_at: null,
    ...overrides,
  }) as User;

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
  let passwords: { hash: jest.Mock; compare: jest.Mock };
  let storage: { getById: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findIdByEmail: jest.fn().mockResolvedValue(null),
      findByEmailWithPassword: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    passwords = {
      hash: jest.fn().mockResolvedValue('hashed'),
      compare: jest.fn().mockResolvedValue(true),
    };
    storage = { getById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: PasswordService, useValue: passwords },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  const createInput = {
    email: 'jane@example.com',
    password: 'super-secret',
    name: 'Jane',
  };

  describe('create', () => {
    it('stores the hash, never the password, and returns neither', async () => {
      const created = publicUser();
      repository.create.mockResolvedValue(created);

      await expect(service.create(createInput)).resolves.toBe(created);

      expect(passwords.hash).toHaveBeenCalledWith('super-secret');
      const data = argOf(repository.create, 0, 0);
      expect(data.hashed_password).toBe('hashed');
      expect(data).not.toHaveProperty('password');
      expect(created).not.toHaveProperty('hashed_password');
    });

    it('rejects an email already in use with a 409', async () => {
      repository.findIdByEmail.mockResolvedValue({ id: 'other-id' });

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects the email of a soft-deleted user — the address stays burned', async () => {
      // findIdByEmail sees deleted rows on purpose; the unique index does too.
      repository.findIdByEmail.mockResolvedValue({ id: 'deleted-user-id' });

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('turns a unique-constraint violation into a 409, not a 500', async () => {
      // The pre-check passed, so this is the racing request losing to the index.
      repository.create.mockRejectedValue(uniqueViolation('email'));

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('reads the constraint index name when the driver reports no fields', async () => {
      repository.create.mockRejectedValue(
        uniqueViolationByIndex('users_email_key'),
      );

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('still recognises the legacy meta.target shape', async () => {
      repository.create.mockRejectedValue(legacyUniqueViolation('email'));

      await expect(service.create(createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not disguise a violation on some other unique column', async () => {
      repository.create.mockRejectedValue(uniqueViolation('some_other_column'));

      await expect(service.create(createInput)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
    });

    it('rejects an avatar_id that does not resolve with a 400', async () => {
      storage.getById.mockRejectedValue(new NotFoundException('File x'));

      await expect(
        service.create({ ...createInput, avatar_id: 'file-id' }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('connects a live avatar', async () => {
      storage.getById.mockResolvedValue({ id: 'file-id' });
      repository.create.mockResolvedValue(publicUser({ avatar_id: 'file-id' }));

      await service.create({ ...createInput, avatar_id: 'file-id' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatar: { connect: { id: 'file-id' } } }),
      );
    });

    it('propagates a storage failure instead of blaming the caller', async () => {
      storage.getById.mockRejectedValue(new Error('S3 is down'));

      await expect(
        service.create({ ...createInput, avatar_id: 'file-id' }),
      ).rejects.toThrow('S3 is down');
    });

    it('leaves role and confirmed to the database default when unset', async () => {
      repository.create.mockResolvedValue(publicUser());

      await service.create(createInput);

      const data = argOf(repository.create, 0, 0);
      expect(data.role).toBeUndefined();
      expect(data.confirmed).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('returns the user', async () => {
      const user = publicUser();
      repository.findById.mockResolvedValue(user);

      await expect(service.findById('user-id')).resolves.toBe(user);
    });

    it('throws 404 when the repository finds nothing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('echoes page and limit alongside the results', async () => {
      const items = [publicUser()];
      repository.findMany.mockResolvedValue({ items, total: 1 });

      await expect(service.list({ page: 2, limit: 20 })).resolves.toEqual({
        items,
        total: 1,
        page: 2,
        limit: 20,
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(publicUser());
      repository.update.mockImplementation((_id, data: Partial<PublicUser>) =>
        Promise.resolve(publicUser(data)),
      );
    });

    it('throws 404 for an unknown user before touching anything else', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('user-id', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejects an email owned by another live user with a 409', async () => {
      repository.findIdByEmail.mockResolvedValue({ id: 'other-id' });

      await expect(
        service.update('user-id', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('turns a unique-constraint violation into a 409, not a 500', async () => {
      repository.update.mockRejectedValue(uniqueViolation('email'));

      await expect(
        service.update('user-id', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows a user to keep their own email', async () => {
      repository.findIdByEmail.mockResolvedValue({ id: 'user-id' });

      await expect(
        service.update('user-id', { email: 'jane@example.com' }),
      ).resolves.toBeDefined();
    });

    it('never writes hashed_password', async () => {
      await service.update('user-id', { name: 'New' });

      const data = argOf(repository.update, 0, 1);
      expect(data).not.toHaveProperty('hashed_password');
      expect(passwords.hash).not.toHaveBeenCalled();
    });

    it('disconnects the avatar when avatar_id is null', async () => {
      await service.update('user-id', { avatar_id: null });

      const data = argOf(repository.update, 0, 1);
      expect(data.avatar).toEqual({ disconnect: true });
      expect(storage.getById).not.toHaveBeenCalled();
    });

    it('leaves the avatar alone when avatar_id is absent', async () => {
      await service.update('user-id', { name: 'New' });

      const data = argOf(repository.update, 0, 1);
      expect(data).not.toHaveProperty('avatar');
    });

    it('rejects an avatar_id that does not resolve with a 400', async () => {
      storage.getById.mockRejectedValue(new NotFoundException('File x'));

      await expect(
        service.update('user-id', { avatar_id: 'file-id' }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('converts a date_of_birth string to a Date and null to null', async () => {
      await service.update('user-id', { date_of_birth: '1990-05-17' });
      await service.update('user-id', { date_of_birth: null });

      const [first, second] = argsOf(repository.update).map(
        (call) => call[1] as Record<string, unknown>,
      );
      expect(first.date_of_birth).toEqual(new Date('1990-05-17'));
      expect(second.date_of_birth).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('resolves when a row transitioned', async () => {
      repository.softDelete.mockResolvedValue(1);

      await expect(service.softDelete('user-id')).resolves.toBeUndefined();
    });

    it('throws 404 when nothing transitioned', async () => {
      repository.softDelete.mockResolvedValue(0);

      await expect(service.softDelete('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyCredentials', () => {
    it('returns the profile without the hash on success', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(storedUser());
      passwords.compare.mockResolvedValue(true);

      const result = await service.verifyCredentials(
        'jane@example.com',
        'super-secret',
      );

      expect(result).not.toHaveProperty('hashed_password');
      expect(result).not.toHaveProperty('deleted_at');
      expect(result.id).toBe('user-id');
      expect(passwords.compare).toHaveBeenCalledWith(
        'super-secret',
        'stored-hash',
      );
    });

    it('throws the same 401 for an unknown email and a wrong password', async () => {
      const thrownBy = async (email: string, password: string) => {
        try {
          await service.verifyCredentials(email, password);
        } catch (error) {
          return error as UnauthorizedException;
        }
        throw new Error('expected verifyCredentials to reject');
      };

      repository.findByEmailWithPassword.mockResolvedValue(null);
      const unknownEmail = await thrownBy('nobody@example.com', 'whatever');

      repository.findByEmailWithPassword.mockResolvedValue(storedUser());
      passwords.compare.mockResolvedValue(false);
      const wrongPassword = await thrownBy('jane@example.com', 'wrong');

      expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
      expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmail.message).toBe(wrongPassword.message);
      expect(unknownEmail.message).toBe('Invalid email or password');
    });

    it('still runs a comparison when the email is unknown', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.verifyCredentials('nobody@example.com', 'whatever'),
      ).rejects.toThrow(UnauthorizedException);

      expect(passwords.compare).toHaveBeenCalledTimes(1);
      expect(passwords.hash).toHaveBeenCalledTimes(1);
    });

    it('hashes the dummy value only once across unknown-email logins', async () => {
      repository.findByEmailWithPassword.mockResolvedValue(null);

      await service.verifyCredentials('a@example.com', 'x').catch(() => null);
      await service.verifyCredentials('b@example.com', 'y').catch(() => null);

      expect(passwords.hash).toHaveBeenCalledTimes(1);
      expect(passwords.compare).toHaveBeenCalledTimes(2);
    });
  });
});
