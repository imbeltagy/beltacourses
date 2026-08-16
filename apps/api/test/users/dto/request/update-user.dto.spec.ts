import { Role } from '@repo/db';
import { UpdateUserDto } from '../../../../src/users/dto/request/update-user.dto';
import { check } from './dto-harness';

describe('UpdateUserDto', () => {
  it('accepts an empty body', async () => {
    const { failed } = await check(UpdateUserDto, {});

    expect(failed).toEqual([]);
  });

  it('has no password field — changing one needs the current password', async () => {
    const { dto } = await check(UpdateUserDto, { password: 'new-password' });

    expect(dto).not.toHaveProperty('password');
  });

  it('has no role field — the role is fixed when the account is created', async () => {
    const { dto } = await check(UpdateUserDto, { role: Role.admin });

    expect(dto).not.toHaveProperty('role');
  });

  describe('clearing a field', () => {
    it.each(['bio', 'gender', 'date_of_birth', 'avatar_id'])(
      'reads an empty %s as null, since a form cannot send null',
      async (field) => {
        const { dto, failed } = await check(UpdateUserDto, { [field]: '' });

        expect(failed).toEqual([]);
        expect(dto[field]).toBeNull();
      },
    );

    it.each(['email', 'name'])(
      'refuses to clear %s, which is not nullable',
      async (field) => {
        const { failed } = await check(UpdateUserDto, { [field]: '' });

        expect(failed).toEqual([field]);
      },
    );
  });

  it('still validates a value that is present', async () => {
    const { failed } = await check(UpdateUserDto, {
      email: 'not-an-email',
      avatar_id: 'not-a-uuid',
    });

    expect(failed.sort()).toEqual(['avatar_id', 'email']);
  });

  it('reads the form string "false" as false, not as a truthy string', async () => {
    const { dto, failed } = await check(UpdateUserDto, { confirmed: 'false' });

    expect(failed).toEqual([]);
    expect(dto.confirmed).toBe(false);
  });
});
