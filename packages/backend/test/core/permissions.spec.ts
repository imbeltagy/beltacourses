import { hasAllPermissions, matchesPermission } from '../../src/core/permissions';

describe('matchesPermission', () => {
  const cases: Array<[string, string, boolean]> = [
    ['users:read', 'users:read', true],
    ['users:*', 'users:read', true],
    ['users:*', 'users:create', true],
    ['*', 'users:read', true],
    ['*:read', 'users:read', true],
    ['users:read', 'users:create', false],
    ['users:read', 'users:*', false],
    ['users:*', 'groups:read', false],
    ['users:read:own', 'users:read', false],
  ];

  it.each(cases)('matchesPermission(%s, %s) -> %s', (granted, required, expected) => {
    expect(matchesPermission(granted, required)).toBe(expected);
  });
});

describe('hasAllPermissions', () => {
  it('passes when every required string is matched', () => {
    expect(
      hasAllPermissions(
        ['users:*', 'groups:*'],
        ['users:read', 'users:create', 'groups:read'],
      ),
    ).toBe(true);
  });

  it('fails when one required string is unmatched', () => {
    expect(
      hasAllPermissions(['users:read'], ['users:read', 'users:create']),
    ).toBe(false);
  });

  it('fails with an empty granted list', () => {
    expect(hasAllPermissions([], ['users:read'])).toBe(false);
  });

  it('satisfies [users:*, groups:*] for [users:read, users:create, groups:read]', () => {
    expect(
      hasAllPermissions(
        ['users:*', 'groups:*'],
        ['users:read', 'users:create', 'groups:read'],
      ),
    ).toBe(true);
  });

  it('satisfies [users:*, groups:read] for [users:read, users:create, groups:read]', () => {
    expect(
      hasAllPermissions(
        ['users:*', 'groups:read'],
        ['users:read', 'users:create', 'groups:read'],
      ),
    ).toBe(true);
  });

  it('satisfies [users:read, users:create, groups:read] for itself', () => {
    expect(
      hasAllPermissions(
        ['users:read', 'users:create', 'groups:read'],
        ['users:read', 'users:create', 'groups:read'],
      ),
    ).toBe(true);
  });
});
