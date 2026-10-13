import { describe, expect, it } from 'vitest';
import { ConflictError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { IUnitOfWork } from '../../../../../src/Domain/Shared/IUnitOfWork.js';
import { CreateUser } from '../../../../../src/Domain/User/Create/CreateUser.js';
import type { IUserRepository } from '../../../../../src/Domain/User/IUserRepository.js';
import { User } from '../../../../../src/Domain/User/User.js';
import { IssueSession } from '../../../../../src/Domain/Auth/IssueSession/IssueSession.js';
import type { IRefreshTokenRepository } from '../../../../../src/Domain/Auth/IRefreshTokenRepository.js';
import type { IUserIdentityRepository } from '../../../../../src/Domain/Auth/IUserIdentityRepository.js';
import { LoginWithExternalIdentity } from '../../../../../src/Domain/Auth/Login/LoginWithExternalIdentity.js';
import type { RefreshToken } from '../../../../../src/Domain/Auth/RefreshToken.js';
import type { UserIdentity } from '../../../../../src/Domain/Auth/UserIdentity.js';

describe('LoginWithExternalIdentity', () => {
    it('creates the user on the first login and reuses the identity afterwards', async () => {
        const users = new InMemoryUsers();
        const identities = new InMemoryIdentities();
        const refreshTokens = new InMemoryRefreshTokens();
        const unitOfWork = new ImmediateUnitOfWork();
        const login = new LoginWithExternalIdentity(
            users,
            identities,
            new CreateUser(users),
            unitOfWork,
            new IssueSession(refreshTokens, unitOfWork),
        );
        let created = 0;
        const input = {
            provider: 'google',
            subject: 'subject-1',
            displayName: 'Ada Lovelace',
            avatarUrl: null,
            userAgent: 'vitest',
            ttlSeconds: 3600,
            createUser: () => {
                created += 1;
                return User.create({
                    email: 'ada@example.com',
                    displayName: 'Ada Lovelace',
                    avatarUrl: null,
                });
            },
        };

        const first = await login.execute(input);
        const second = await login.execute(input);

        expect(created).toBe(1);
        expect(second.user.id).toBe(first.user.id);
        expect(second.rawRefreshToken).not.toBe(first.rawRefreshToken);
        expect(users.saved).toHaveLength(1);
        expect(refreshTokens.saved).toHaveLength(2);
    });

    it('rejects a second identity that reuses an existing email', async () => {
        const users = new InMemoryUsers();
        const unitOfWork = new ImmediateUnitOfWork();
        const login = new LoginWithExternalIdentity(
            users,
            new InMemoryIdentities(),
            new CreateUser(users),
            unitOfWork,
            new IssueSession(new InMemoryRefreshTokens(), unitOfWork),
        );
        await login.execute({
            provider: 'google',
            subject: 'subject-1',
            displayName: 'Ada',
            avatarUrl: null,
            userAgent: null,
            ttlSeconds: 3600,
            createUser: () =>
                User.create({
                    email: 'ada@example.com',
                    displayName: 'Ada',
                    avatarUrl: null,
                }),
        });

        await expect(
            login.execute({
                provider: 'google',
                subject: 'subject-2',
                displayName: 'Ada',
                avatarUrl: null,
                userAgent: null,
                ttlSeconds: 3600,
                createUser: () =>
                    User.create({
                        email: 'ada@example.com',
                        displayName: 'Ada',
                        avatarUrl: null,
                    }),
            }),
        ).rejects.toBeInstanceOf(ConflictError);
    });
});

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
        return this.saved.find((user) => user.email === email) ?? null;
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

class InMemoryIdentities implements IUserIdentityRepository {
    private readonly items: UserIdentity[] = [];

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
    readonly saved: RefreshToken[] = [];

    async findByHash(): Promise<RefreshToken | null> {
        return null;
    }

    async save(token: RefreshToken): Promise<void> {
        this.saved.push(token);
    }

    async revokeFamily(): Promise<void> {}
}
