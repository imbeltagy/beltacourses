import 'dotenv/config';
import { prisma } from '../../src';
import { seedSuperAdmin } from './super-admin.seed';
import { seedDemoUsers } from './demo-users.seed';

async function main() {
  console.log('Starting database seeding...');

  await seedSuperAdmin(prisma);
  await seedDemoUsers(prisma);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
