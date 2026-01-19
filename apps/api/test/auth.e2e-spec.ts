import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/session (GET)', () => {
    it('should return null for unauthenticated users', () => {
      return request(app.getHttpServer())
        .get('/api/auth/session')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.session).toBeNull();
          expect(res.body.user).toBeNull();
        });
    });
  });

  describe('Email/Password Authentication', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Test User E2E',
    };

    it('should register a new user with email/password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    it('should not allow duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: 'Duplicate User',
        })
        .expect(400);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject login with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('Session Management', () => {
    let sessionCookie: string;
    const testUser = {
      email: `session-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Session Test User',
    };

    beforeAll(async () => {
      // Create and login user
      await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      sessionCookie = loginResponse.headers['set-cookie'];
    });

    it('should return user session with valid cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should logout and clear session', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('Cookie', sessionCookie)
        .expect(200);

      const sessionResponse = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(sessionResponse.body.session).toBeNull();
    });
  });
});
