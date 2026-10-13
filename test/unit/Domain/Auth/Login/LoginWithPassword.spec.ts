import { describe, expect, it } from 'vitest';
import {
    UnauthorizedError,
    ValidationError,
} from '../../../../../src/Domain/Shared/DomainError.js';
import type { IUnitOfWork } from '../../../../../src/Domain/Shared/IUnitOfWork.js';
import { CreateUser } from '../../../../../src/Domain/User/Create/CreateUser.js';
import type { IUserRepository } from '../../../../../src/Domain/User/IUserRepository.js';
import { User } from '../../../../../src/Domain/User/User.js';
import { IssueSession } from '../../../../../src/Domain/Auth/IssueSession/IssueSession.js';
import type { IPasswordHasher } from '../../../../../src/Domain/Auth/IPasswordHasher.js';
import type { IRefreshTokenRepository } from '../../../../../src/Domain/Auth/IRefreshTokenRepository.js';
import type { IUserCredentialRepository } from '../../../../../src/Domain/Auth/IUserCredentialRepository.js';
import type { RefreshToken } from '../../../../../src/Domain/Auth/RefreshToken.js';
import { UserCredential } from '../../../../../src/Domain/Auth/UserCredential.js';
import { RegisterWithPassword } from '../../../../../src/Domain/Auth/Register/RegisterWithPassword.js';
import { LoginWithPassword } from '../../../../../src/Domain/Auth/Login/LoginWithPassword.js';

const PASSWORD = 'correct horse battery';

describe('LoginWithPassword', () => {
    it('issues a session and updates lastLoginAt without changing the profile', async () => {
        const harness = createHarness();
        const createdAt = new Date('2026-01-01T00:00:00.000Z');
        await harness.register.execute({
            ...registration(),
            now: createdAt,
        });
        const loggedInAt = new Date('2026-10-11T15:00:00.000Z');
        const result = await harness.login.execute({
            ...credentials(),
            now: loggedInAt,
        });

        expect(result.user.email).toBe('ada@example.com');
        expect(result.user.displayName).toBe('Ada Lovelace');
        expect(result.user.lastLoginAt?.toISOString()).toBe(
            loggedInAt.toISOString(),
        );
        expect(harness.tokens.saved).toHaveLength(2);
        expect(harness.tokens.saved[0]?.tokenHash).not.toBe(
            harness.tokens.saved[1]?.tokenHash,
        );
        expect(JSON.stringify(result.user)).not.toContain(PASSWORD);
    });

    it('accepts the same email with different case and surrounding spaces', async () => {
        const harness = createHarness();
        await harness.register.execute(
            registration({ email: '  Ada@Example.com ' }),
        );
        const result = await harness.login.execute(
            credentials({ email: 'ADA@example.com' }),
        );
        expect(result.user.email).toBe('ada@example.com');
    });

    it('rejects a wrong password and an unknown email with the same error', async () => {
        const harness = createHarness();
        await harness.register.execute(registration());
        await expect(
            harness.login.execute(
                credentials({ password: 'wrong-horse-battery' }),
            ),
        ).rejects.toMatchObject({ message: 'Authentication failed' });
        await expect(
            harness.login.execute(
                credentials({ email: 'missing@example.com' }),
            ),
        ).rejects.toMatchObject({ message: 'Authentication failed' });
        expect(harness.passwords.verifiedHashes.at(-1)).toBe(
            harness.passwords.dummy,
        );
        expect(harness.tokens.saved).toHaveLength(1);
    });

    it('rejects a Google account that has no local credential', async () => {
        const harness = createHarness();
        const googleUser = User.create({
            email: 'ada@example.com',
            displayName: 'Ada Lovelace',
            avatarUrl: 'https://example.com/ada.png',
        });
        await harness.users.save(googleUser);
        const before = googleUser.displayName;

        try {
            await harness.login.execute(credentials());
            expect.fail('expected authentication to fail');
        } catch (error) {
            expect(error).toBeInstanceOf(UnauthorizedError);
            expect((error as Error).message).toBe('Authentication failed');
            expect((error as Error).message.toLowerCase()).not.toContain(
                'google',
            );
            expect((error as Error).message).not.toContain(PASSWORD);
        }
        expect(harness.passwords.verifiedHashes).toEqual([
            harness.passwords.dummy,
        ]);
        expect(googleUser.displayName).toBe(before);
        expect(harness.credentials.items).toHaveLength(0);
        expect(harness.tokens.saved).toHaveLength(0);
    });

    it('rejects a correct password when the email is not allowed', async () => {
        const harness = createHarness();
        const createdAt = new Date('2026-01-01T00:00:00.000Z');
        await harness.register.execute(registration({ now: createdAt }));
        await expect(
            harness.login.execute(
                credentials({ allowedEmails: ['other@example.com'] }),
            ),
        ).rejects.toMatchObject({ message: 'Authentication failed' });
        expect(harness.users.saved[0]?.lastLoginAt?.toISOString()).toBe(
            createdAt.toISOString(),
        );
        expect(harness.tokens.saved).toHaveLength(1);
    });

    it('rehashes when the stored Argon2id parameters are outdated', async () => {
        const harness = createHarness();
        await harness.register.execute(registration());
        const previous = harness.credentials.items[0]?.passwordHash;
        harness.passwords.rehash = true;
        await harness.login.execute(credentials());
        expect(harness.credentials.items[0]?.passwordHash).not.toBe(previous);
        expect(
            harness.credentials.items[0]?.passwordHash.startsWith('$argon2id$'),
        ).toBe(true);
        expect(harness.passwords.hashedPasswords.at(-1)).toBe(PASSWORD);
    });

    it('does not trim the password before verification', async () => {
        const harness = createHarness();
        const password = 'horse-battery ';
        await harness.register.execute(registration({ password }));
        await expect(
            harness.login.execute(credentials({ password: password.trim() })),
        ).rejects.toBeInstanceOf(UnauthorizedError);
        const result = await harness.login.execute(credentials({ password }));
        expect(result.user.email).toBe('ada@example.com');
        expect(harness.passwords.hashedPasswords[0]).toBe(password);
    });

    it('rejects a blank or oversized password before verification', async () => {
        const harness = createHarness();
        await expect(
            harness.login.execute(credentials({ password: ' '.repeat(12) })),
        ).rejects.toBeInstanceOf(ValidationError);
        await expect(
            harness.login.execute(credentials({ password: 'a'.repeat(129) })),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(harness.passwords.verifiedHashes).toHaveLength(0);
    });
});

function registration(
    overrides: Partial<Parameters<RegisterWithPassword['execute']>[0]> = {},
) {
    return {
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        password: PASSWORD,
        userAgent: 'vitest',
        ttlSeconds: 3600,
        allowedEmails: null,
        ...overrides,
    };
}

function credentials(
    overrides: Partial<Parameters<LoginWithPassword['execute']>[0]> = {},
) {
    return {
        email: 'ada@example.com',
        password: PASSWORD,
        userAgent: 'vitest',
        ttlSeconds: 3600,
        allowedEmails: null,
        ...overrides,
    };
}

function createHarness() {
    const users = new InMemoryUsers();
    const credentialsRepo = new InMemoryCredentials();
    const tokens = new InMemoryRefreshTokens();
    const passwords = new FakeHasher();
    const unitOfWork = new ImmediateUnitOfWork();
    const register = new RegisterWithPassword(
        users,
        credentialsRepo,
        passwords,
        new CreateUser(users),
        new IssueSession(tokens, unitOfWork),
        unitOfWork,
    );
    const login = new LoginWithPassword(
        users,
        credentialsRepo,
        passwords,
        new IssueSession(tokens, unitOfWork),
        unitOfWork,
    );
    return {
        users,
        credentials: credentialsRepo,
        tokens,
        passwords,
        register,
        login,
    };
}

class ImmediateUnitOfWork implements IUnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}

class InMemoryUsers implements IUserRepository {
    readonly saved: User[] = [];

    async findById(id: string): Promise<User | null> {
        return this.saved.find((user) => user.id === id) ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        return (
            this.saved.find(
                (user) => user.email === email.trim().toLowerCase(),
            ) ?? null
        );
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

class InMemoryRefreshTokens implements IRefreshTokenRepository {
    readonly saved: RefreshToken[] = [];

    async findByHash(): Promise<RefreshToken | null> {
        return null;
    }

    async save(token: RefreshToken): Promise<void> {
        this.saved.push(token);
    }

    async revokeFamily(): Promise<void> {}
}

class FakeHasher implements IPasswordHasher {
    private sequence = 0;
    private readonly known = new Map<string, string>();
    readonly hashedPasswords: string[] = [];
    readonly verifiedHashes: string[] = [];
    rehash = false;
    readonly dummy = `$argon2id$v=19$m=19456,t=2,p=1$${'d'.repeat(22)}$${'e'.repeat(22)}`;

    async hash(password: string): Promise<string> {
        this.hashedPasswords.push(password);
        const encoded = `$argon2id$v=19$m=19456,t=2,p=1$${'a'.repeat(22)}$fake${this.sequence}${'x'.repeat(24)}`;
        this.sequence += 1;
        this.known.set(encoded, password);
        return encoded;
    }

    async verify(password: string, passwordHash: string): Promise<boolean> {
        this.verifiedHashes.push(passwordHash);
        return this.known.get(passwordHash) === password;
    }

    needsRehash(): boolean {
        return this.rehash;
    }

    async dummyHash(): Promise<string> {
        return this.dummy;
    }
}
