import { describe, expect, it } from 'vitest';
import { Environment, EnvironmentError } from '../../src/Environment.js';

describe('Environment ludopedia settings', () => {
    it('defaults the base URL and allows an empty token in test', () => {
        const environment = Environment.load(baseEnv({ NODE_ENV: 'test' }));
        expect(environment.ludopediaApiBaseUrl).toBe(
            'https://ludopedia.com.br/api/v1',
        );
        expect(environment.ludopediaAccessToken).toBe('');
    });

    it('requires the access token outside test', () => {
        expect(() =>
            Environment.load(baseEnv({ NODE_ENV: 'development' })),
        ).toThrow(EnvironmentError);
        try {
            Environment.load(baseEnv({ NODE_ENV: 'development' }));
        } catch (error) {
            expect(error).toBeInstanceOf(EnvironmentError);
            expect((error as Error).message).toContain(
                'LUDOPEDIA_ACCESS_TOKEN is required',
            );
        }
    });

    it('accepts an absolute https base URL', () => {
        const environment = Environment.load(
            baseEnv({
                NODE_ENV: 'test',
                LUDOPEDIA_API_BASE_URL: 'https://ludopedia.test/api/v1/',
                LUDOPEDIA_ACCESS_TOKEN: 'token',
            }),
        );
        expect(environment.ludopediaApiBaseUrl).toBe(
            'https://ludopedia.test/api/v1',
        );
        expect(environment.ludopediaAccessToken).toBe('token');
    });

    it('rejects a base URL that is not https', () => {
        expect(() =>
            Environment.load(
                baseEnv({
                    NODE_ENV: 'test',
                    LUDOPEDIA_API_BASE_URL: 'http://ludopedia.test/api/v1',
                }),
            ),
        ).toThrow(EnvironmentError);
    });
});

function baseEnv(overrides: Record<string, string>): NodeJS.ProcessEnv {
    return {
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
        ...overrides,
    };
}
