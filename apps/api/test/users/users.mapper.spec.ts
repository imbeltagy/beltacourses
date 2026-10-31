import { UserResponseDto } from '../../src/users/dto/response/user.dto';
import { UserMapper } from '../../src/users/users.mapper';
import { userRow } from '../helpers/rows';

const toDto = (row: ReturnType<typeof userRow>) => UserMapper.toDto(row);

describe('UserMapper', () => {
  it('toDto returns a UserResponseDto instance', () => {
    expect(toDto(userRow())).toBeInstanceOf(UserResponseDto);
  });

  it('drops the hash, soft-delete marker and raw foreign keys', () => {
    const dto = toDto(userRow());

    expect(dto).not.toHaveProperty('hashed_password');
    expect(dto).not.toHaveProperty('deleted_at');
    expect(dto).not.toHaveProperty('avatar_id');
    expect(dto).not.toHaveProperty('group_id');
    expect(dto).toMatchObject({
      id: 'user-1',
      email: 'student@beltacourses.com',
      avatar: null,
      group: null,
    });
  });

  it('narrows avatar to id + url and group to id + name', () => {
    const dto = toDto(
      userRow({
        avatar: {
          id: 'file-1',
          url: 'https://cdn/x.png',
          key: '2026/08/x.png',
          name: 'x.png',
          size: 1,
          mime_type: 'image/png',
          bucket: 'bucket',
          created_at: new Date(),
          deleted_at: null,
        },
        group: {
          id: 'group-1',
          name: 'Support',
          description: 'desc',
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      }),
    );

    expect({ ...dto.avatar }).toEqual({
      id: 'file-1',
      url: 'https://cdn/x.png',
    });
    expect({ ...dto.group }).toEqual({ id: 'group-1', name: 'Support' });
  });

  it('keeps dates as Date instances', () => {
    const row = userRow();

    expect(toDto(row).created_at).toEqual(row.created_at);
  });

  it('toListDto maps every row and keeps the meta', () => {
    const result = UserMapper.toListDto({
      data: [userRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    expect(result.data[0]).toBeInstanceOf(UserResponseDto);
    expect(result.data[0]).not.toHaveProperty('hashed_password');
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });
});
