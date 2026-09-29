import * as bcrypt from 'bcrypt';
import { Role, type PrismaClient } from '../../generated/prisma/client';

const DEFAULT_SALT_ROUNDS = 12;

const DEMO_USERS = [
  { email: 'student@beltacourses.com', name: 'Demo Student', role: Role.student },
  { email: 'teacher@beltacourses.com', name: 'Demo Teacher', role: Role.teacher },
] as const;

const DEMO_PASSWORD = 'a1234567';

/**
 * Matches `LoginDto`'s own Swagger examples (`student@beltacourses.com` /
 * `a1234567`) so the API docs and a fresh dev DB agree. Hashing scheme copied
 * from `seedSuperAdmin` — see the comment there for why it can't import
 * `PasswordService` directly.
 */
export async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  const saltRounds = process.env.PASSWORD_SALT_ROUNDS
    ? Number(process.env.PASSWORD_SALT_ROUNDS)
    : DEFAULT_SALT_ROUNDS;
  const salt = process.env.PASSWORD_SALT;
  if (!salt) {
    console.log('Skipping demo-users seed: PASSWORD_SALT not set.');
    return;
  }

  const hashed_password = await bcrypt.hash(DEMO_PASSWORD + salt, saltRounds);

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        hashed_password,
        name: user.name,
        role: user.role,
        confirmed: true,
      },
    });

    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}
