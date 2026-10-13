import { describe, expect, it } from 'vitest';
import { Environment } from '../../../src/Environment.js';
import { UnauthorizedError } from '../../../src/Domain/Shared/DomainError.js';
import { AccessTokenService } from '../../../src/Auth/AccessTokenService.js';

describe('AccessTokenService', () => {
    it('round-trips a subject and rejects alg none', async () => {
        const service = new AccessTokenService(testEnvironment());
        const token = await service.sign('user-1');
        await expect(service.verify(token)).resolves.toEqual({ sub: 'user-1' });

        const header = Buffer.from(
            JSON.stringify({ alg: 'none', typ: 'JWT' }),
        ).toString('base64url');
        const payload = Buffer.from(
            JSON.stringify({
                sub: 'user-1',
                iss: 'board-imperium',
                aud: 'board-imperium',
            }),
        ).toString('base64url');
        await expect(
            service.verify(`${header}.${payload}.`),
        ).rejects.toBeInstanceOf(UnauthorizedError);
    });
});

function testEnvironment(): Environment {
    return Environment.load({
        NODE_ENV: 'test',
        PORT: '3000',
        FRONT_URL: 'http://localhost:4200',
        DB_HOST: 'mysql',
        DB_PORT: '3306',
        DB_NAME: 'board_imperium',
        DB_USER: 'board',
        DB_PASSWORD: 'board-secret',
        GOOGLE_CLIENT_ID: 'google-client',
        GOOGLE_CLIENT_SECRET: 'google-secret',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
        JWT_ACCESS_SECRET: 'x'.repeat(48),
        JWT_ACCESS_TTL: '15m',
        REFRESH_TOKEN_TTL: '30d',
        COOKIE_SECURE: 'false',
    });
}
