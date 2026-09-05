import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@repo/db';
import { PasswordService } from '@repo/service/core';
import { PrismaService } from '@repo/service/prisma';
import { RedisService } from '@repo/service/redis';
import { AppModule } from '../../src/app.module';

/** A dedicated Redis DB index — never the default one BullMQ/dev use. */
const TEST_REDIS_DB = 15;

describe('Admin permission groups (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  let passwordService: PasswordService;

  const plainPassword = 'correcthorsebattery';
  const superAdminEmail = `super-admin-${randomUUID()}@integration.test`;
  const adminEmail = `admin-${randomUUID()}@integration.test`;
  const teacherEmail = `teacher-${randomUUID()}@integration.test`;
  const studentEmail = `student-${randomUUID()}@integration.test`;

  let adminId: string;
  let teacherId: string;
  let groupId: string;
  let superAdminAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    redis = moduleFixture.get(RedisService);
    passwordService = moduleFixture.get(PasswordService);

    await redis.client.select(TEST_REDIS_DB);
    await redis.client.flushdb();

    const hashed_password = await passwordService.hash(plainPassword);
    const superAdmin = await prisma.client.user.create({
      data: {
        email: superAdminEmail,
        hashed_password,
        name: 'Integration Super Admin',
        role: Role.super_admin,
        confirmed: true,
      },
    });
    const admin = await prisma.client.user.create({
      data: {
        email: adminEmail,
        hashed_password,
        name: 'Integration Admin',
        role: Role.admin,
        confirmed: true,
      },
    });
    const teacher = await prisma.client.user.create({
      data: {
        email: teacherEmail,
        hashed_password,
        name: 'Integration Teacher',
        role: Role.teacher,
        confirmed: true,
      },
    });
    await prisma.client.user.create({
      data: {
        email: studentEmail,
        hashed_password,
        name: 'Integration Student',
        role: Role.student,
        confirmed: true,
      },
    });
    adminId = admin.id;
    teacherId = teacher.id;

    const superAdminLogin = await request(app.getHttpServer())
      .post('/auth/moderators/login')
      .send({ email: superAdminEmail, password: plainPassword });
    superAdminAccessToken = (superAdminLogin.body as { access_token: string })
      .access_token;
    void superAdmin;
  });

  afterAll(async () => {
    await prisma.client.groupPermission.deleteMany({
      where: { group_id: groupId },
    });
    await prisma.client.group.deleteMany({ where: { id: groupId } });
    // Matches the fixed fixtures above and the ad-hoc `throwaway-*` user
    // created mid-test, so nothing under this domain is ever left behind.
    await prisma.client.user.deleteMany({
      where: {
        email: {
          endsWith: '@integration.test',
        },
      },
    });
    await redis.client.flushdb();
    await app.close();
  });

  async function loginAs(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/moderators/login')
      .send({ email, password: plainPassword });
    return (response.body as { access_token: string }).access_token;
  }

  it('runs the full permission-group lifecycle', async () => {
    // 1. Create a group with ["users:read"]; assign it to the admin.
    const createResponse = await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .send({ name: `Support ${randomUUID()}`, permissions: ['users:read'] })
      .expect(201);
    groupId = (createResponse.body as { id: string }).id;

    await request(app.getHttpServer())
      .put(`/groups/${groupId}/users/${adminId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);

    let adminAccessToken = await loginAs(adminEmail);

    // 2. GET /users -> 200; DELETE /users/:id -> 403.
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/users/${teacherId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(403);

    // 3. Replace the group's permissions with ["users:*"] -> DELETE now 200.
    await request(app.getHttpServer())
      .patch(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .send({ permissions: ['users:*'] })
      .expect(200);

    // Assigning again revokes the admin's live sessions (D18): the
    // still-live access token from step 1/2 goes 401 immediately afterwards.
    const preRevokeAccessToken = adminAccessToken;
    await request(app.getHttpServer())
      .put(`/groups/${groupId}/users/${adminId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${preRevokeAccessToken}`)
      .expect(401);
    adminAccessToken = await loginAs(adminEmail);

    // 4. Assert the PATCH replaced rather than merged.
    const groupRow = await prisma.client.group.findUniqueOrThrow({
      where: { id: groupId },
      include: { permissions: true },
    });
    expect(groupRow.permissions.map((p) => p.permission)).toEqual(['users:*']);

    // Now the delete succeeds with the wider permission.
    // (Use a throwaway target so we don't destroy the teacher fixture.)
    const throwaway = await prisma.client.user.create({
      data: {
        email: `throwaway-${randomUUID()}@integration.test`,
        hashed_password: await passwordService.hash(plainPassword),
        name: 'Throwaway',
        role: Role.student,
        confirmed: true,
      },
    });
    await request(app.getHttpServer())
      .delete(`/users/${throwaway.id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(204);

    // 5. Unassign -> revokes sessions (401 on the still-live token), then
    // GET /users -> 403 on a fresh token; unassigning a non-member -> 404.
    const preUnassignAccessToken = adminAccessToken;
    await request(app.getHttpServer())
      .delete(`/groups/${groupId}/users/${adminId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${preUnassignAccessToken}`)
      .expect(401);
    adminAccessToken = await loginAs(adminEmail);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/groups/${groupId}/users/${adminId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(404);

    // 9. Assigning a group to a teacher -> 400 (checked here, before the
    // group is soft-deleted below, so the 400 isn't masked by a 404).
    await request(app.getHttpServer())
      .put(`/groups/${groupId}/users/${teacherId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(400);

    // 6. Soft-delete the group -> the assigned admin gets 403 (fail-closed).
    await request(app.getHttpServer())
      .put(`/groups/${groupId}/users/${adminId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);
    adminAccessToken = await loginAs(adminEmail);
    await request(app.getHttpServer())
      .delete(`/groups/${groupId}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(403);

    // 7. super_admin reaches every route with no group at all.
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/users/${throwaway.id}`)
      .set('Authorization', `Bearer ${superAdminAccessToken}`)
      .expect(404); // already deleted above

    // 8. A student token on GET /users -> 403 from RolesGuard, and on a
    // permissions-only route -> 403 from PermissionsGuard.
    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: studentEmail, password: plainPassword })
      .expect(200);
    const studentAccessToken = (studentLogin.body as { access_token: string })
      .access_token;

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/groups/permissions')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .expect(403);
  });
});
