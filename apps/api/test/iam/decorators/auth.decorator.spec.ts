import { Reflector } from '@nestjs/core';
import { Role } from '@repo/db';
import { AUTH_OPTIONS_KEY } from '../../../src/iam/constants/auth.constants';
import { Auth } from '../../../src/iam/decorators/auth.decorator';

/**
 * The type-level half is checked by `tsc` (ts-jest and `check-types`):
 * every `@ts-expect-error` below fails to compile if the line stops being an
 * error.
 */
describe('@Auth', () => {
  it('stores its options as metadata', () => {
    class A {
      @Auth({ roles: Role.super_admin })
      route() {}
    }

    expect(new Reflector().get(AUTH_OPTIONS_KEY, A.prototype.route)).toEqual({
      roles: Role.super_admin,
    });
  });

  it('accepts the valid shapes', () => {
    class A {
      @Auth({ public: true })
      a() {}
      @Auth({ public: false })
      b() {}
      @Auth({ public: false, roles: [Role.admin] })
      c() {}
      @Auth({ roles: [Role.admin, Role.super_admin] })
      d() {}
      @Auth({ permissions: 'users:read' })
      e() {}
      @Auth({ roles: Role.admin, permissions: ['users:read'] })
      f() {}
    }

    expect(A).toBeDefined();
  });

  it('rejects invalid shapes at compile time', () => {
    class A {
      // @ts-expect-error an empty object says nothing about who may call
      @Auth({})
      empty() {}
      // @ts-expect-error public routes cannot name roles
      @Auth({ public: true, roles: Role.admin })
      publicWithRoles() {}
      // @ts-expect-error public routes cannot name permissions
      @Auth({ public: true, permissions: 'users:read' })
      publicWithPermissions() {}
      // @ts-expect-error unknown permission string
      @Auth({ permissions: 'users:fly' })
      unknownPermission() {}
    }

    expect(A).toBeDefined();
  });
});
