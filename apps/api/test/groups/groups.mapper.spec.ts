import { GroupResponseDto } from '../../src/groups/dto/response/group.dto';
import { GroupMapper } from '../../src/groups/groups.mapper';
import { groupRow } from '../helpers/rows';

describe('GroupMapper', () => {
  it('toDto flattens permissions to string[] and reads users_count from _count', () => {
    const row = groupRow();

    const dto = GroupMapper.toDto(row);

    expect(dto).toBeInstanceOf(GroupResponseDto);
    expect({ ...dto }).toEqual({
      id: 'group-1',
      name: 'Support',
      description: null,
      permissions: ['users:read'],
      users_count: 2,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  });

  it('toListDto maps every row and keeps the meta', () => {
    const result = GroupMapper.toListDto({
      data: [groupRow()],
      meta: { total: 1, page: 1, limit: 20 },
    });

    expect(result.data[0]).toBeInstanceOf(GroupResponseDto);
    expect(result.data[0]).toMatchObject({ users_count: 2 });
    expect({ ...result.meta }).toEqual({ total: 1, page: 1, limit: 20 });
  });
});
