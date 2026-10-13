import { describe, expect, it } from 'vitest';
import {
    ConflictError,
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
import { PASSWORD_MIN_LENGTH } from '../../../../../src/Domain/Auth/PasswordPolicy.js';
import type { RefreshToken } from '../../../../../src/Domain/Auth/RefreshToken.js';
import { UserCredential } from '../../../../../src/Domain/Auth/UserCredential.js';
import {
    REGISTRATION_CONFLICT_MESSAGE,
    RegisterWithPassword,
} from '../../../../../src/Domain/Auth/Register/RegisterWithPassword.js';

const PASSWORD = 'correct horse battery';

describe('RegisterWithPassword', () => {
    it('creates the user and credential and issues a refresh token', async () => {
        const harness = createHarness();
        const result = await harness.register.execute(input());

        expect(result.user.email).toBe('ada@example.com');
        expect(result.user.displayName).toBe('Ada Lovelace');
        expect(result.rawRefreshToken.length).toBeGreaterThan(20);
        expect(harness.credentials.items).toHaveLength(1);
        expect(harness.credentials.items[0]?.passwordHash).not.toBe(PASSWORD);
        expect(
            harness.credentials.items[0]?.passwordHash.startsWith('$argon2id$'),
        ).toBe(true);
        expect(JSON.stringify(result.user)).not.toContain(PASSWORD);
        expect(JSON.stringify(result.user)).not.toContain('passwordHash');
        expect(harness.passwords.hashedPasswords).toEqual([PASSWORD]);
    });

    it('normalizes email case and surrounding spaces before lookup', async () => {
        const harness = createHarness();
        const result = await harness.register.execute(
            input({ email: '  Ada@Example.com ' }),
        );
        expect(result.user.email).toBe('ada@example.com');
        await expect(
            harness.register.execute(input({ email: 'ADA@example.com' })),
        ).rejects.toMatchObject({ message: REGISTRATION_CONFLICT_MESSAGE });
        expect(harness.users.saved).toHaveLength(1);
    });

    it('preserves the password exactly, including surrounding spaces', async () => {
        const harness = createHarness();
        const password = '  horse-battery';
        await harness.register.execute(input({ password }));
        expect(harness.passwords.hashedPasswords).toEqual([password]);
    });

    it('rejects a duplicate email with a generic conflict', async () => {
        const harness = createHarness();
        await harness.register.execute(input());
        await expect(harness.register.execute(input())).rejects.toMatchObject({
            message: REGISTRATION_CONFLICT_MESSAGE,
        });
        expect(harness.credentials.items).toHaveLength(1);
    });

    it('does not attach a password to an existing Google account', async () => {
        const harness = createHarness();
        const googleUser = User.create({
            email: 'ada@example.com',
            displayName: 'Ada Lovelace',
            avatarUrl: null,
        });
        await harness.users.save(googleUser);

        try {
            await harness.register.execute(input());
            expect.fail('expected a conflict');
        } catch (error) {
            expect(error).toBeInstanceOf(ConflictError);
            expect((error as Error).message).toBe(
                REGISTRATION_CONFLICT_MESSAGE,
            );
            expect((error as Error).message.toLowerCase()).not.toContain(
                'google',
            );
            expect((error as Error).message).not.toContain(PASSWORD);
        }
        expect(harness.credentials.items).toHaveLength(0);
        expect(harness.users.saved).toHaveLength(1);
        expect(harness.users.saved[0]?.id).toBe(googleUser.id);
    });

    it('rejects an email outside AUTH_ALLOWED_EMAILS with the same conflict', async () => {
        const harness = createHarness();
        await expect(
            harness.register.execute(
                input({
                    email: 'bob@example.com',
                    allowedEmails: ['ada@example.com'],
                }),
            ),
        ).rejects.toMatchObject({ message: REGISTRATION_CONFLICT_MESSAGE });
        expect(harness.users.saved).toHaveLength(0);
        expect(harness.credentials.items).toHaveLength(0);
        expect(harness.passwords.hashedPasswords).toHaveLength(1);
    });

    it('rejects passwords outside the length bounds before hashing', async () => {
        const harness = createHarness();
        await expect(
            harness.register.execute(
                input({ password: 'a'.repeat(PASSWORD_MIN_LENGTH - 1) }),
            ),
        ).rejects.toBeInstanceOf(ValidationError);
        await expect(
            harness.register.execute(input({ password: 'a'.repeat(129) })),
        ).rejects.toBeInstanceOf(ValidationError);
        await expect(
            harness.register.execute(input({ password: ' '.repeat(12) })),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(harness.passwords.hashedPasswords).toHaveLength(0);
        expect(harness.users.saved).toHaveLength(0);
    });

    it('accepts passwords at the minimum and maximum lengths', async () => {
        const harness = createHarness();
        await harness.register.execute(
            input({
                email: 'min@example.com',
                password: 'a'.repeat(PASSWORD_MIN_LENGTH),
            }),
        );
        await harness.register.execute(
            input({
                email: 'max@example.com',
                password: `b${'c'.repeat(127)}`,
            }),
        );
        expect(
            harness.passwords.hashedPasswords.map(
                (password) => password.length,
            ),
        ).toEqual([PASSWORD_MIN_LENGTH, 128]);
    });

    it('rolls the user back when the credential cannot be saved', async () => {
        const users = new InMemoryUsers();
        const tokens = new InMemoryRefreshTokens();
        const unitOfWork = new SnapshotUnitOfWork(users);
        const credentials = new FailingCredentials();
        const register = new RegisterWithPassword(
            users,
            credentials,
            new FakeHasher(),
            new CreateUser(users),
            new IssueSession(tokens, unitOfWork),
            unitOfWork,
        );

        await expect(register.execute(input())).rejects.toMatchObject({
            message: REGISTRATION_CONFLICT_MESSAGE,
        });
        expect(users.saved).toHaveLength(0);
        expect(tokens.saved).toHaveLength(0);
    });

    it('hides a unique-key failure from the user repository', async () => {
        const users = new UsersThatRejectSave();
        const tokens = new InMemoryRefreshTokens();
        const unitOfWork = new ImmediateUnitOfWork();
        const credentials = new InMemoryCredentials();
        const register = new RegisterWithPassword(
            users,
            credentials,
            new FakeHasher(),
            new CreateUser(users),
            new IssueSession(tokens, unitOfWork),
            unitOfWork,
        );

        try {
            await register.execute(input());
            expect.fail('expected a conflict');
        } catch (error) {
            expect(error).toBeInstanceOf(ConflictError);
            expect((error as Error).message).toBe(
                REGISTRATION_CONFLICT_MESSAGE,
            );
            expect((error as Error).message).not.toContain(
                'Email already exists',
            );
            expect((error as Error).message).not.toContain(PASSWORD);
        }
        expect(credentials.items).toHaveLength(0);
    });
});

function input(
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

function createHarness() {
    const users = new InMemoryUsers();
    const credentials = new InMemoryCredentials();
    const tokens = new InMemoryRefreshTokens();
    const passwords = new FakeHasher();
    const unitOfWork = new ImmediateUnitOfWork();
    const register = new RegisterWithPassword(
        users,
        credentials,
        passwords,
        new CreateUser(users),
        new IssueSession(tokens, unitOfWork),
        unitOfWork,
    );
    return { users, credentials, tokens, passwords, register };
}

class ImmediateUnitOfWork implements IUnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}

class SnapshotUnitOfWork implements IUnitOfWork {
    private depth = 0;

    constructor(private readonly users: InMemoryUsers) {}

    async run<T>(work: () => Promise<T>): Promise<T> {
        if (this.depth > 0) {
            return work();
        }
        const snapshot = this.users.clone();
        this.depth += 1;
        try {
            return await work();
        } catch (error) {
            this.users.restore(snapshot);
            throw error;
        } finally {
            this.depth -= 1;
        }
    }
}

class InMemoryUsers implements IUserRepository {
    readonly saved: User[] = [];

    clone(): User[] {
        return this.saved.map((user) =>
            User.rehydrate({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }),
        );
    }

    restore(snapshot: User[]): void {
        this.saved.splice(0, this.saved.length, ...snapshot);
    }

    async findById(id: string): Promise<User | null> {
        return this.saved.find((user) => user.id === id) ?? null;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.saved.find((user) => user.email === email) ?? null;
    }

    async save(user: User): Promise<void> {
        const duplicate = this.saved.find(
            (item) => item.email === user.email && item.id !== user.id,
        );
        if (duplicate) {
            throw new ConflictError('Email already exists');
        }
        const index = this.saved.findIndex((item) => item.id === user.id);
        if (index >= 0) {
            this.saved[index] = user;
        } else {
            this.saved.push(user);
        }
    }
}

class UsersThatRejectSave implements IUserRepository {
    async findById(): Promise<User | null> {
        return null;
    }

    async findByEmail(): Promise<User | null> {
        return null;
    }

    async save(): Promise<void> {
        throw new ConflictError('Email already exists');
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

class FailingCredentials implements IUserCredentialRepository {
    async findByUserId(): Promise<UserCredential | null> {
        return null;
    }

    async save(): Promise<void> {
        throw new ConflictError('Credential already exists');
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
    readonly hashedPasswords: string[] = [];

    async hash(password: string): Promise<string> {
        this.hashedPasswords.push(password);
        const encoded = `$argon2id$v=19$m=19456,t=2,p=1$${'a'.repeat(22)}$fakeHashValue${this.sequence}${'x'.repeat(20)}`;
        this.sequence += 1;
        return encoded;
    }

    async verify(): Promise<boolean> {
        return false;
    }

    needsRehash(): boolean {
        return false;
    }

    async dummyHash(): Promise<string> {
        return `$argon2id$v=19$m=19456,t=2,p=1$${'d'.repeat(22)}$${'e'.repeat(22)}`;
    }
}
