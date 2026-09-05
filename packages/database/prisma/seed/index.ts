import 'dotenv/config';
import { prisma } from '../../src';
import { seedSuperAdmin } from './super-admin.seed';

async function main() {
  console.log('Starting database seeding...');

  await seedSuperAdmin(prisma);

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
