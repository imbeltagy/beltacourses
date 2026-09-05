import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@repo/db';
import { PasswordService, SessionService } from '@repo/service/core';
import { PrismaService } from '@repo/service/prisma';
import { RedisService } from '@repo/service/redis';
import { AppModule } from '../../src/app.module';

/** A dedicated Redis DB index — never the default one BullMQ/dev use. */
const TEST_REDIS_DB = 15;

describe('Moderator session lifecycle (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: RedisService;
  let passwordService: PasswordService;
  let sessionService: SessionService;

  const superAdminEmail = `super-admin-${randomUUID()}@integration.test`;
  const adminEmail = `admin-${randomUUID()}@integration.test`;
  const plainPassword = 'correcthorsebattery';

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
    sessionService = moduleFixture.get(SessionService);

    await redis.client.select(TEST_REDIS_DB);
    await redis.client.flushdb();

    const hashed_password = await passwordService.hash(plainPassword);
    await prisma.client.user.create({
      data: {
        email: superAdminEmail,
        hashed_password,
        name: 'Integration Super Admin',
        role: Role.super_admin,
        confirmed: true,
      },
    });
    await prisma.client.user.create({
      data: {
        email: adminEmail,
        hashed_password,
        name: 'Integration Admin',
        role: Role.admin,
        confirmed: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.client.user.deleteMany({
      where: { email: { endsWith: '@integration.test' } },
    });
    await redis.client.flushdb();
    await app.close();
  });

  it('runs the full moderator session lifecycle', async () => {
    // 1-2. Login and assert Redis holds the session + index.
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/moderators/login')
      .send({ email: adminEmail, password: plainPassword })
      .expect(200);

    const { access_token, refresh_token } = loginResponse.body as {
      access_token: string;
      refresh_token: string;
    };
    expect(access_token).toEqual(expect.any(String));
    expect(refresh_token).toEqual(expect.any(String));

    const claims = JSON.parse(
      Buffer.from(access_token.split('.')[1], 'base64url').toString('utf8'),
    ) as { sub: string; sid: string };

    const sessionKeys = await redis.client.keys(`session:${claims.sub}:*`);
    expect(sessionKeys.length).toBe(1);
    const ttl = await redis.client.ttl(sessionKeys[0]);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(10 * 60 * 60);

    const indexMembers = await redis.client.smembers(`sessions:${claims.sub}`);
    expect(indexMembers).toContain(claims.sid);

    // 3. A guarded route with the access token -> 200.
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    // 4. Refresh -> new access token, same sid, and it works.
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token })
      .expect(200);
    const refreshBody = refreshResponse.body as {
      access_token: string;
      refresh_token?: string;
    };
    const newAccessToken = refreshBody.access_token;
    expect(refreshBody.refresh_token).toBeUndefined();

    const newClaims = JSON.parse(
      Buffer.from(newAccessToken.split('.')[1], 'base64url').toString('utf8'),
    ) as { sid: string };
    expect(newClaims.sid).toBe(claims.sid);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(200);

    // 5. Logout -> 204; the Redis key is gone.
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(204);

    const keysAfterLogout = await redis.client.keys(`session:${claims.sub}:*`);
    expect(keysAfterLogout).toHaveLength(0);

    // 6. The same access token now -> 401 (logout kills access tokens too).
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(401);

    // 7. Refresh with the old refresh token -> 401.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token })
      .expect(401);

    // 8. A refresh token whose signature was tampered with -> 401.
    const tampered = `${refresh_token.slice(0, -1)}${refresh_token.at(-1) === 'a' ? 'b' : 'a'}`;
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: tampered })
      .expect(401);
  });

  it('tracks two logins as two sids, and removeAllUserSessions kills both', async () => {
    const first = await request(app.getHttpServer())
      .post('/auth/moderators/login')
      .send({ email: superAdminEmail, password: plainPassword })
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/auth/moderators/login')
      .send({ email: superAdminEmail, password: plainPassword })
      .expect(200);

    const firstBody = first.body as { access_token: string };
    const secondBody = second.body as { access_token: string };

    const firstClaims = JSON.parse(
      Buffer.from(firstBody.access_token.split('.')[1], 'base64url').toString(
        'utf8',
      ),
    ) as { sub: string; sid: string };
    const secondClaims = JSON.parse(
      Buffer.from(secondBody.access_token.split('.')[1], 'base64url').toString(
        'utf8',
      ),
    ) as { sub: string; sid: string };

    const indexMembers = await redis.client.smembers(
      `sessions:${firstClaims.sub}`,
    );
    expect(indexMembers.sort()).toEqual(
      [firstClaims.sid, secondClaims.sid].sort(),
    );

    const removed = await sessionService.removeAllUserSessions(firstClaims.sub);
    expect(removed).toBe(2);

    const keysAfter = await redis.client.keys(`session:${firstClaims.sub}:*`);
    expect(keysAfter).toHaveLength(0);
  });
});
