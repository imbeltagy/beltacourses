import * as bcrypt from 'bcrypt';
import { Role, type PrismaClient } from '../../generated/prisma/client';

const DEFAULT_SALT_ROUNDS = 12;

/**
 * Re-implements the exact hashing scheme from
 * `packages/service/src/core/password.service.ts` (`plain + PASSWORD_SALT`,
 * `PASSWORD_SALT_ROUNDS` defaulting to 12) — `@repo/db` cannot import
 * `PasswordService` back without a cycle, since `@repo/service` depends on
 * `@repo/db`. If either scheme changes and the other does not, the seeded
 * account silently cannot log in.
 */
export async function seedSuperAdmin(prisma: PrismaClient): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';

  if (!email || !password) {
    console.log(
      'Skipping super_admin seed: SUPER_ADMIN_EMAIL/SUPER_ADMIN_PASSWORD not set.',
    );
    return;
  }

  const saltRounds = process.env.PASSWORD_SALT_ROUNDS
    ? Number(process.env.PASSWORD_SALT_ROUNDS)
    : DEFAULT_SALT_ROUNDS;
  const salt = process.env.PASSWORD_SALT;
  if (!salt) {
    console.log('Skipping super_admin seed: PASSWORD_SALT not set.');
    return;
  }

  const hashed_password = await bcrypt.hash(password + salt, saltRounds);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      hashed_password,
      name,
      role: Role.super_admin,
      confirmed: true,
    },
  });

  console.log(`Seeded super_admin: ${email}`);
}
