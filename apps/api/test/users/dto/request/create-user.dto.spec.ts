import { Role } from '@repo/db';
import { CreateUserDto } from '../../../../src/users/dto/request/create-user.dto';
import { check } from './dto-harness';

const valid = {
  email: 'jane@example.com',
  password: 'super-secret',
  name: 'Jane Doe',
};

describe('CreateUserDto', () => {
  it('accepts the minimum a caller must send', async () => {
    const { failed } = await check(CreateUserDto, valid);

    expect(failed).toEqual([]);
  });

  describe('role', () => {
    it.each([Role.student, Role.teacher, Role.academy_moderator, Role.admin])(
      'accepts %s',
      async (role) => {
        const { failed } = await check(CreateUserDto, { ...valid, role });

        expect(failed).toEqual([]);
      },
    );

    it('refuses super_admin — never created over HTTP', async () => {
      const { failed } = await check(CreateUserDto, {
        ...valid,
        role: Role.super_admin,
      });

      expect(failed).toEqual(['role']);
    });

    it('refuses a role that is not a role at all', async () => {
      const { failed } = await check(CreateUserDto, {
        ...valid,
        role: 'wizard',
      });

      expect(failed).toEqual(['role']);
    });
  });

  describe('confirmed', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('reads the form string %p as %p', async (sent, expected) => {
      const { dto, failed } = await check(CreateUserDto, {
        ...valid,
        confirmed: sent,
      });

      expect(failed).toEqual([]);
      expect(dto.confirmed).toBe(expected);
    });

    it('still rejects a value that is neither', async () => {
      const { failed } = await check(CreateUserDto, {
        ...valid,
        confirmed: 'maybe',
      });

      expect(failed).toEqual(['confirmed']);
    });
  });

  describe('avatar_id', () => {
    it('must be a uuid when sent', async () => {
      const { failed } = await check(CreateUserDto, {
        ...valid,
        avatar_id: 'not-a-uuid',
      });

      expect(failed).toEqual(['avatar_id']);
    });
  });
});
