import { PrismaClient } from "../../src";

export async function seedUsers(prisma: PrismaClient) {
  console.log("Starting users seeding...");

  // Access Groups
  const fullAccessGroup = await prisma.accessGroup.create({
    data: {
      name: "Full Access",
      description: "All permissions",
    },
  });

  const usersViewGroup = await prisma.accessGroup.create({
    data: {
      name: "Users View",
      description: "View users only",
    },
  });

  const rolesFullAccessGroup = await prisma.accessGroup.create({
    data: {
      name: "Roles Full Access",
      description: "Full access to access groups",
    },
  });

  await prisma.permission.createMany({
    data: [
      {
        key: "users:full-access",
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: "access-groups:full-access",
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: "courses:full-access",
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: "modules:full-access",
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: "lectures:full-access",
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: "users:read",
        accessGroupId: usersViewGroup.id,
      },
      {
        key: "access-groups:full-access",
        accessGroupId: rolesFullAccessGroup.id,
      },
    ],
  });

  console.log("Created access groups and permissions");

  // Users
  const student = await prisma.user.create({
    data: {
      email: "student@beltacourses.com",
      name: "Belta Student",
      role: "student",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@beltacourses.com",
      name: "Belta Teacher",
      role: "teacher",
      bio: "Belta Teacher focuses on practical web development.\nTeaches modern frontend and backend workflows.\nGuides students through real projects and feedback.",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@beltacourses.com",
      name: "Belta Admin",
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      email: "employee@beltacourses.com",
      name: "Belta Employee",
      role: "employee",
      accessGroupId: fullAccessGroup.id,
      gender: "male",
      date_of_birth: "1995-06-20",
    },
  });

  console.log("Created users");

  // Create wallets for student and teacher
  await prisma.wallet.create({
    data: {
      userId: student.id,
      amount: 0,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: teacher.id,
      amount: 0,
    },
  });

  console.log("Created wallets for student and teacher");
  console.log("Users seeding completed successfully!");
}
