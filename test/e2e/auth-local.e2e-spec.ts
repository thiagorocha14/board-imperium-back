import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import type { Response as SupertestResponse } from 'supertest';
import request from 'supertest';
import { GlobalExceptionFilter } from '../../src/API/Filters/GlobalExceptionFilter.js';
import { validationPipe } from '../../src/API/Validation.js';
import { CompleteGoogleLoginController } from '../../src/API/Auth/GoogleCallback/CompleteGoogleLoginController.js';
import { StartGoogleLoginController } from '../../src/API/Auth/GoogleLogin/StartGoogleLoginController.js';
import { LoginWithPasswordController } from '../../src/API/Auth/Login/LoginWithPasswordController.js';
import { LogoutController } from '../../src/API/Auth/Logout/LogoutController.js';
import { RefreshSessionController } from '../../src/API/Auth/Refresh/RefreshSessionController.js';
import { RegisterWithPasswordController } from '../../src/API/Auth/Register/RegisterWithPasswordController.js';
import { GetCurrentUserController } from '../../src/API/User/GetCurrent/GetCurrentUserController.js';
import {
    AUTH_LOGIN_LIMIT,
    AUTH_LOGIN_TTL_MS,
    AUTH_REGISTER_LIMIT,
    AUTH_REGISTER_TTL_MS,
    skipThrottleUnlessPath,
} from '../../src/Auth/AuthRateLimits.js';
import { AccessTokenService } from '../../src/Auth/AccessTokenService.js';
import { AuthCookieService } from '../../src/Auth/AuthCookieService.js';
import { AuthSessionService } from '../../src/Auth/AuthSessionService.js';
import { CsrfGuard } from '../../src/Auth/CsrfGuard.js';
import { CredentialOriginGuard } from '../../src/Auth/CredentialOriginGuard.js';
import { JwtAuthGuard } from '../../src/Auth/JwtAuthGuard.js';
import {
    EXTERNAL_LOGIN,
    type IExternalLogin,
} from '../../src/Domain/Auth/IExternalLogin.js';
import { GoogleOidcClient } from '../../src/Infrastructure/Clients/Google/GoogleOidcClient.js';
import { Argon2PasswordHasher } from '../../src/Auth/Argon2PasswordHasher.js';
import { PASSWORD_HASHER } from '../../src/Domain/Auth/IPasswordHasher.js';
import {
    REFRESH_TOKEN_REPOSITORY,
    type IRefreshTokenRepository,
} from '../../src/Domain/Auth/IRefreshTokenRepository.js';
import {
    USER_CREDENTIAL_REPOSITORY,
    type IUserCredentialRepository,
} from '../../src/Domain/Auth/IUserCredentialRepository.js';
import {
    USER_IDENTITY_REPOSITORY,
    type IUserIdentityRepository,
} from '../../src/Domain/Auth/IUserIdentityRepository.js';
import { IssueSession } from '../../src/Domain/Auth/IssueSession/IssueSession.js';
import { LoginWithExternalIdentity } from '../../src/Domain/Auth/Login/LoginWithExternalIdentity.js';
import { LoginWithPassword } from '../../src/Domain/Auth/Login/LoginWithPassword.js';
import type { RefreshToken } from '../../src/Domain/Auth/RefreshToken.js';
import { RegisterWithPassword } from '../../src/Domain/Auth/Register/RegisterWithPassword.js';
import { RevokeRefreshTokenFamily } from '../../src/Domain/Auth/RevokeRefreshTokenFamily/RevokeRefreshTokenFamily.js';
import { RotateRefreshToken } from '../../src/Domain/Auth/RotateRefreshToken/RotateRefreshToken.js';
import type { UserCredential } from '../../src/Domain/Auth/UserCredential.js';
import type { UserIdentity } from '../../src/Domain/Auth/UserIdentity.js';
import {
    UNIT_OF_WORK,
    type IUnitOfWork,
} from '../../src/Domain/Shared/IUnitOfWork.js';
import { CreateUser } from '../../src/Domain/User/Create/CreateUser.js';
import { GetCurrentUser } from '../../src/Domain/User/GetCurrent/GetCurrentUser.js';
import {
    USER_REPOSITORY,
    type IUserRepository,
} from '../../src/Domain/User/IUserRepository.js';
import { User } from '../../src/Domain/User/User.js';
import { Environment } from '../../src/Environment.js';
import { normalizeEmailShape } from '../../src/Domain/User/Email.js';

const FRONT = 'http://localhost:4200';
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const OIDC_COOKIE = 'oidc_transaction';
const PASSWORD = 'correct-horse-battery';

describe('local authentication', () => {
    describe('session', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp();
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('registers, sets session cookies, and rotates the refresh token', async () => {
            const registered = await post(ctx, '/auth/register', {
                email: 'Ada@Example.com',
                displayName: 'Ada Lovelace',
                password: PASSWORD,
            }).expect(204);
            expectNoSecrets(registered, PASSWORD);
            expectSessionCookies(registered);

            const me = await request(ctx.app.getHttpServer())
                .get('/users/me')
                .set(
                    'Cookie',
                    `${ACCESS_COOKIE}=${cookieValue(registered, ACCESS_COOKIE)}`,
                )
                .expect(200);
            expect(me.body).toMatchObject({
                email: 'ada@example.com',
                displayName: 'Ada Lovelace',
            });
            expectNoSecrets(me, PASSWORD);

            const refresh = cookieValue(registered, REFRESH_COOKIE);
            const rotated = await request(ctx.app.getHttpServer())
                .post('/auth/refresh')
                .set('Origin', FRONT)
                .set('Cookie', `${REFRESH_COOKIE}=${refresh}`)
                .expect(204);
            const nextRefresh = cookieValue(rotated, REFRESH_COOKIE);
            expect(nextRefresh).not.toBe(refresh);
            expectSessionCookies(rotated);
            await request(ctx.app.getHttpServer())
                .get('/users/me')
                .set(
                    'Cookie',
                    `${ACCESS_COOKIE}=${cookieValue(rotated, ACCESS_COOKIE)}`,
                )
                .expect(200);
            await request(ctx.app.getHttpServer())
                .post('/auth/refresh')
                .set('Origin', FRONT)
                .set('Cookie', `${REFRESH_COOKIE}=${refresh}`)
                .expect(401);
        });

        it('logs in with the registered password', async () => {
            const response = await post(ctx, '/auth/login', {
                email: 'ada@example.com',
                password: PASSWORD,
            }).expect(204);
            expectNoSecrets(response, PASSWORD);
            expectSessionCookies(response);
        });

        it('returns the same error for a wrong password and an unknown email', async () => {
            const wrong = await post(ctx, '/auth/login', {
                email: 'ada@example.com',
                password: 'wrong-horse-battery',
            }).expect(401);
            const missing = await post(ctx, '/auth/login', {
                email: 'missing@example.com',
                password: PASSWORD,
            }).expect(401);
            expect(wrong.body).toEqual(missing.body);
            expect(wrong.body).toMatchObject({
                statusCode: 401,
                message: 'Authentication failed',
            });
            expectNoSecrets(wrong, 'wrong-horse-battery');
            expectNoSecrets(missing, PASSWORD);
        });

        it('logs in when the email only differs by case and spaces', async () => {
            const response = await post(ctx, '/auth/login', {
                email: '  ADA@example.com ',
                password: PASSWORD,
            }).expect(204);
            expectSessionCookies(response);
        });
    });

    describe('request validation', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp();
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('rejects short, oversized, blank, and unknown fields', async () => {
            const secret = 'unique-field-secret';
            const cases = [
                {
                    email: 'a@example.com',
                    displayName: 'Ada',
                    password: '1234567',
                },
                {
                    email: 'b@example.com',
                    displayName: 'Ada',
                    password: 'z'.repeat(129),
                },
                {
                    email: 'c@example.com',
                    displayName: 'Ada',
                    password: ' '.repeat(12),
                },
                {
                    email: 'd@example.com',
                    displayName: 'Ada',
                    password: secret,
                    role: 'admin',
                },
            ];
            for (const body of cases) {
                const response = await post(ctx, '/auth/register', body).expect(
                    400,
                );
                expectNoSecrets(response, String(body.password));
                expect(JSON.stringify(response.body)).not.toContain('admin');
            }
        });

        it('keeps spaces that are part of the password', async () => {
            const password = 'horse-battery ';
            await post(ctx, '/auth/register', {
                email: 'spaced@example.com',
                displayName: 'Ada Lovelace',
                password,
            }).expect(204);
            const trimmed = await post(ctx, '/auth/login', {
                email: 'spaced@example.com',
                password: password.trim(),
            }).expect(401);
            expectNoSecrets(trimmed, password.trim());
            const exact = await post(ctx, '/auth/login', {
                email: 'spaced@example.com',
                password,
            }).expect(204);
            expectNoSecrets(exact, password);
            expectSessionCookies(exact);
        });
    });

    describe('conflicts and Google login', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp({
                google: {
                    async startLogin() {
                        return {
                            authorizationUrl:
                                'https://accounts.google.com/o/oauth2/v2/auth',
                            state: 'state-1',
                            nonce: 'nonce-1',
                            codeVerifier: 'verifier-1',
                        };
                    },
                    async completeLogin() {
                        return {
                            provider: 'google',
                            subject: 'google-subject-1',
                            email: 'Ada@Example.com',
                            displayName: 'Ada Lovelace',
                            avatarUrl: null,
                        };
                    },
                },
            });
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('keeps Google login working and does not link a local password', async () => {
            const start = await request(ctx.app.getHttpServer())
                .get('/auth/google/login')
                .expect(302);
            const callback = await request(ctx.app.getHttpServer())
                .get('/auth/google/callback')
                .query({ state: 'state-1' })
                .set('Cookie', cookiePair(start, OIDC_COOKIE))
                .expect(302);
            expect(callback.headers.location).toBe(FRONT);
            expectSessionCookies(callback);
            expect(ctx.identities.items).toHaveLength(1);

            const googleUser = await ctx.users.findByEmail('ada@example.com');
            expect(googleUser).not.toBeNull();
            expect(
                await ctx.credentials.findByUserId(googleUser?.id ?? ''),
            ).toBeNull();

            const conflict = await post(ctx, '/auth/register', {
                email: 'ada@example.com',
                displayName: 'Ada Lovelace',
                password: PASSWORD,
            }).expect(409);
            expect(conflict.body).toEqual({
                statusCode: 409,
                error: 'ConflictError',
                message: 'Unable to complete registration',
            });
            expect(JSON.stringify(conflict.body).toLowerCase()).not.toContain(
                'google',
            );
            expectNoSecrets(conflict, PASSWORD);
            expect(
                await ctx.credentials.findByUserId(googleUser?.id ?? ''),
            ).toBeNull();
            expect(ctx.identities.items).toHaveLength(1);

            const asPassword = await post(ctx, '/auth/login', {
                email: 'ada@example.com',
                password: PASSWORD,
            }).expect(401);
            const unknown = await post(ctx, '/auth/login', {
                email: 'nobody@example.com',
                password: PASSWORD,
            }).expect(401);
            expect(asPassword.body).toEqual(unknown.body);

            await post(ctx, '/auth/register', {
                email: 'grace@example.com',
                displayName: 'Grace Hopper',
                password: PASSWORD,
            }).expect(204);
            const duplicate = await post(ctx, '/auth/register', {
                email: 'grace@example.com',
                displayName: 'Grace Hopper',
                password: PASSWORD,
            }).expect(409);
            expect(duplicate.body).toEqual(conflict.body);
        });
    });

    describe('allowed emails', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp({ allowedEmails: 'ada@example.com' });
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('applies AUTH_ALLOWED_EMAILS without a distinct error', async () => {
            const denied = await post(ctx, '/auth/register', {
                email: 'bob@example.com',
                displayName: 'Bob',
                password: PASSWORD,
            }).expect(409);
            expect(denied.body.message).toBe('Unable to complete registration');
            expect(await ctx.users.findByEmail('bob@example.com')).toBeNull();

            await post(ctx, '/auth/register', {
                email: 'Ada@Example.com',
                displayName: 'Ada Lovelace',
                password: PASSWORD,
            }).expect(204);

            const blockedLogin = await post(ctx, '/auth/login', {
                email: 'bob@example.com',
                password: PASSWORD,
            }).expect(401);
            const wrongPassword = await post(ctx, '/auth/login', {
                email: 'ada@example.com',
                password: 'wrong-horse-battery',
            }).expect(401);
            expect(blockedLogin.body).toEqual(wrongPassword.body);

            await post(ctx, '/auth/login', {
                email: 'ada@example.com',
                password: PASSWORD,
            }).expect(204);
        });
    });

    describe('origin', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp();
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('rejects register and login without a trusted Origin or Referer', async () => {
            const body = {
                email: 'ada@example.com',
                displayName: 'Ada Lovelace',
                password: PASSWORD,
            };
            const missing = await request(ctx.app.getHttpServer())
                .post('/auth/register')
                .send(body)
                .expect(403);
            const evil = await request(ctx.app.getHttpServer())
                .post('/auth/register')
                .set('Origin', 'https://evil.example')
                .send(body)
                .expect(403);
            const evilLogin = await request(ctx.app.getHttpServer())
                .post('/auth/login')
                .set('Origin', 'https://evil.example')
                .send({ email: body.email, password: PASSWORD })
                .expect(403);
            for (const response of [missing, evil, evilLogin]) {
                expect(response.body).toMatchObject({ statusCode: 403 });
                expectNoSecrets(response, PASSWORD);
            }

            const referer = await request(ctx.app.getHttpServer())
                .post('/auth/login')
                .set('Referer', `${FRONT}/login`)
                .send({ email: 'ada@example.com', password: PASSWORD })
                .expect(401);
            expect(referer.body).toMatchObject({
                message: 'Authentication failed',
            });
        });
    });

    describe('rate limit', () => {
        let ctx: AuthApp;

        beforeAll(async () => {
            ctx = await createAuthApp();
        });

        afterAll(async () => {
            await ctx?.app.close();
        });

        it('limits registration and login separately', async () => {
            const marker = 'rate-limit-secret';
            const registerResponses = [];
            for (
                let attempt = 0;
                attempt < AUTH_REGISTER_LIMIT + 1;
                attempt += 1
            ) {
                registerResponses.push(
                    await post(ctx, '/auth/register', {
                        email: 'ada@example.com',
                        displayName: 'Ada',
                        password: marker,
                        extra: true,
                    }),
                );
            }
            expect(
                registerResponses
                    .slice(0, AUTH_REGISTER_LIMIT)
                    .map((item) => item.status),
            ).toEqual(Array.from({ length: AUTH_REGISTER_LIMIT }, () => 400));
            expect(registerResponses.at(-1)?.status).toBe(429);
            expect(registerResponses.at(-1)?.body).toMatchObject({
                message: 'Too many requests',
            });

            const loginResponses = [];
            for (
                let attempt = 0;
                attempt < AUTH_LOGIN_LIMIT + 1;
                attempt += 1
            ) {
                loginResponses.push(
                    await post(ctx, '/auth/login', {
                        email: 'ada@example.com',
                        password: marker,
                        extra: true,
                    }),
                );
            }
            expect(
                loginResponses
                    .slice(0, AUTH_LOGIN_LIMIT)
                    .map((item) => item.status),
            ).toEqual(Array.from({ length: AUTH_LOGIN_LIMIT }, () => 400));
            expect(loginResponses.at(-1)?.status).toBe(429);
            for (const response of [...registerResponses, ...loginResponses]) {
                expectNoSecrets(response, marker);
            }
        });
    });
});

interface AuthApp {
    app: INestApplication;
    users: InMemoryUsers;
    credentials: InMemoryCredentials;
    identities: InMemoryIdentities;
}

async function createAuthApp(options?: {
    allowedEmails?: string;
    google?: Pick<IExternalLogin, 'startLogin' | 'completeLogin'>;
}): Promise<AuthApp> {
    const users = new InMemoryUsers();
    const credentials = new InMemoryCredentials();
    const identities = new InMemoryIdentities();
    const refreshTokens = new InMemoryRefreshTokens();
    const unitOfWork: IUnitOfWork = {
        async run(work) {
            return work();
        },
    };
    const moduleRef = await Test.createTestingModule({
        imports: [
            ThrottlerModule.forRoot({
                throttlers: [
                    { name: 'default', ttl: 60_000, limit: 100 },
                    {
                        name: 'auth-login',
                        ttl: AUTH_LOGIN_TTL_MS,
                        limit: AUTH_LOGIN_LIMIT,
                        skipIf: skipThrottleUnlessPath('/auth/login'),
                    },
                    {
                        name: 'auth-register',
                        ttl: AUTH_REGISTER_TTL_MS,
                        limit: AUTH_REGISTER_LIMIT,
                        skipIf: skipThrottleUnlessPath('/auth/register'),
                    },
                ],
            }),
        ],
        controllers: [
            StartGoogleLoginController,
            CompleteGoogleLoginController,
            RefreshSessionController,
            RegisterWithPasswordController,
            LoginWithPasswordController,
            LogoutController,
            GetCurrentUserController,
        ],
        providers: [
            {
                provide: Environment,
                useValue: Environment.load({
                    NODE_ENV: 'test',
                    PORT: '3000',
                    FRONT_URL: FRONT,
                    DB_HOST: 'mysql',
                    DB_PORT: '3306',
                    DB_NAME: 'board_imperium',
                    DB_USER: 'board',
                    DB_PASSWORD: 'board-secret',
                    GOOGLE_CLIENT_ID: 'google-client',
                    GOOGLE_CLIENT_SECRET: 'google-secret',
                    GOOGLE_REDIRECT_URI:
                        'http://localhost:3000/auth/google/callback',
                    JWT_ACCESS_SECRET: 'x'.repeat(48),
                    JWT_ACCESS_TTL: '15m',
                    REFRESH_TOKEN_TTL: '30d',
                    COOKIE_SECURE: 'false',
                    ...(options?.allowedEmails
                        ? { AUTH_ALLOWED_EMAILS: options.allowedEmails }
                        : {}),
                }),
            },
            { provide: USER_REPOSITORY, useValue: users },
            { provide: USER_IDENTITY_REPOSITORY, useValue: identities },
            { provide: USER_CREDENTIAL_REPOSITORY, useValue: credentials },
            { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokens },
            { provide: UNIT_OF_WORK, useValue: unitOfWork },
            { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
            options?.google
                ? { provide: EXTERNAL_LOGIN, useValue: options.google }
                : { provide: EXTERNAL_LOGIN, useClass: GoogleOidcClient },
            AccessTokenService,
            AuthCookieService,
            AuthSessionService,
            IssueSession,
            LoginWithExternalIdentity,
            RegisterWithPassword,
            LoginWithPassword,
            RotateRefreshToken,
            RevokeRefreshTokenFamily,
            CreateUser,
            GetCurrentUser,
            JwtAuthGuard,
            CsrfGuard,
            CredentialOriginGuard,
            { provide: APP_FILTER, useClass: GlobalExceptionFilter },
            { provide: APP_PIPE, useValue: validationPipe },
            { provide: APP_GUARD, useClass: ThrottlerGuard },
            { provide: APP_GUARD, useClass: JwtAuthGuard },
            { provide: APP_GUARD, useClass: CsrfGuard },
        ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    return { app, users, credentials, identities };
}

function post(
    ctx: AuthApp,
    path: string,
    body: Record<string, unknown>,
): request.Test {
    return request(ctx.app.getHttpServer())
        .post(path)
        .set('Origin', FRONT)
        .send(body);
}

function setCookieHeaders(response: SupertestResponse): string[] {
    const raw = response.headers['set-cookie'];
    if (!raw) {
        return [];
    }
    return Array.isArray(raw) ? raw : [raw];
}

function cookieHeader(
    response: SupertestResponse,
    name: string,
): string | undefined {
    return setCookieHeaders(response).find((header) =>
        header.startsWith(`${name}=`),
    );
}

function cookiePair(response: SupertestResponse, name: string): string {
    const header = cookieHeader(response, name);
    const pair = header?.split(';')[0];
    if (!pair) {
        throw new Error(`Missing cookie ${name}`);
    }
    return pair;
}

function cookieValue(response: SupertestResponse, name: string): string {
    const pair = cookiePair(response, name);
    return pair.slice(name.length + 1);
}

function expectSessionCookies(response: SupertestResponse): void {
    const access = cookieHeader(response, ACCESS_COOKIE);
    const refresh = cookieHeader(response, REFRESH_COOKIE);
    expect(access).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/HttpOnly/i);
    expect(access).toMatch(/SameSite=Lax/i);
    expect(refresh).toMatch(/SameSite=Lax/i);
    expect(access).not.toMatch(/(?:^|;\s*)Secure(?:;|$)/i);
    expect(refresh).not.toMatch(/(?:^|;\s*)Secure(?:;|$)/i);
    expect(access).toMatch(/Path=\/(?:;|$)/);
    expect(refresh).toMatch(/Path=\/auth(?:;|$)/);
}

function expectNoSecrets(response: SupertestResponse, secret: string): void {
    const serialized = `${response.text}\n${JSON.stringify(response.body)}\n${JSON.stringify(response.headers['set-cookie'] ?? '')}`;
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain('$argon2');
    expect(serialized).not.toContain('passwordHash');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(response.body).not.toHaveProperty('password');
}

class InMemoryUsers implements IUserRepository {
    readonly saved: User[] = [];

    async findById(id: string): Promise<User | null> {
        return this.saved.find((user) => user.id === id) ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const canonical = normalizeEmailShape(email);
        return this.saved.find((user) => user.email === canonical) ?? null;
    }

    async save(user: User): Promise<void> {
        const index = this.saved.findIndex((item) => item.id === user.id);
        if (index >= 0) {
            this.saved[index] = user;
        } else {
            this.saved.push(user);
        }
    }
}

class InMemoryCredentials implements IUserCredentialRepository {
    readonly items: UserCredential[] = [];

    async findByUserId(userId: string): Promise<UserCredential | null> {
        return this.items.find((item) => item.userId === userId) ?? null;
    }

    async save(credential: UserCredential): Promise<void> {
        const index = this.items.findIndex(
            (item) => item.userId === credential.userId,
        );
        if (index >= 0) {
            this.items[index] = credential;
        } else {
            this.items.push(credential);
        }
    }
}

class InMemoryIdentities implements IUserIdentityRepository {
    readonly items: UserIdentity[] = [];

    async findByProviderSubject(
        provider: string,
        providerSubject: string,
    ): Promise<UserIdentity | null> {
        return (
            this.items.find(
                (item) =>
                    item.provider === provider &&
                    item.providerSubject === providerSubject,
            ) ?? null
        );
    }

    async save(identity: UserIdentity): Promise<void> {
        this.items.push(identity);
    }
}

class InMemoryRefreshTokens implements IRefreshTokenRepository {
    private readonly items: RefreshToken[] = [];

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        return this.items.find((item) => item.tokenHash === tokenHash) ?? null;
    }

    async save(token: RefreshToken): Promise<void> {
        const index = this.items.findIndex((item) => item.id === token.id);
        if (index >= 0) {
            this.items[index] = token;
        } else {
            this.items.push(token);
        }
    }

    async revokeFamily(familyId: string, at: Date): Promise<void> {
        for (const token of this.items) {
            if (token.familyId === familyId && !token.isRevoked()) {
                token.revoke(at);
            }
        }
    }
}
