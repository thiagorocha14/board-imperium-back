import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../../src/AppModule.js';

describe('HTTP security baseline', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /health returns ok', async () => {
        const response = await request(app.getHttpServer())
            .get('/health')
            .expect(200);
        expect(response.body).toEqual({ status: 'ok' });
    });

    it('GET /users/me without a cookie returns 401', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/me')
            .expect(401);
        expect(response.body).toMatchObject({
            statusCode: 401,
            error: 'UnauthorizedError',
        });
        expect(response.body).not.toHaveProperty('stack');
    });

    it('POST /auth/refresh with a cookie from another origin returns 403', async () => {
        await request(app.getHttpServer())
            .post('/auth/refresh')
            .set('Cookie', 'refresh_token=not-a-real-token')
            .set('Origin', 'https://evil.example')
            .expect(403);
    });
});
