import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { IUnitOfWork } from '../../../../../src/Domain/Shared/IUnitOfWork.js';
import type { IRefreshTokenRepository } from '../../../../../src/Domain/Auth/IRefreshTokenRepository.js';
import {
    generateRefreshToken,
    RefreshToken,
} from '../../../../../src/Domain/Auth/RefreshToken.js';
import { RotateRefreshToken } from '../../../../../src/Domain/Auth/RotateRefreshToken/RotateRefreshToken.js';

describe('RotateRefreshToken', () => {
    it('rotates the token and rejects the previous one by revoking the family', async () => {
        const repository = new InMemoryRefreshTokens();
        const rotate = new RotateRefreshToken(
            repository,
            new ImmediateUnitOfWork(),
        );
        const now = new Date('2026-10-09T12:00:00.000Z');
        const original = generateRefreshToken();
        await repository.save(
            RefreshToken.issue({
                userId: 'user-1',
                familyId: 'family-1',
                rawToken: original,
                userAgent: null,
                ttlSeconds: 3600,
                now,
            }),
        );

        const rotated = await rotate.execute({
            rawToken: original,
            userAgent: 'vitest',
            ttlSeconds: 3600,
            now,
        });

        expect(rotated.userId).toBe('user-1');
        expect(rotated.rawRefreshToken).not.toBe(original);

        await expect(
            rotate.execute({
                rawToken: original,
                userAgent: null,
                ttlSeconds: 3600,
                now,
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(repository.all().every((token) => token.isRevoked())).toBe(true);
        await expect(
            rotate.execute({
                rawToken: rotated.rawRefreshToken,
                userAgent: null,
                ttlSeconds: 3600,
                now,
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('does not revoke the family when an unused token is only expired', async () => {
        const repository = new InMemoryRefreshTokens();
        const rotate = new RotateRefreshToken(
            repository,
            new ImmediateUnitOfWork(),
        );
        const issuedAt = new Date('2026-10-09T12:00:00.000Z');
        const rawToken = generateRefreshToken();
        await repository.save(
            RefreshToken.issue({
                userId: 'user-1',
                familyId: 'family-1',
                rawToken,
                userAgent: null,
                ttlSeconds: 60,
                now: issuedAt,
            }),
        );

        await expect(
            rotate.execute({
                rawToken,
                userAgent: null,
                ttlSeconds: 60,
                now: new Date(issuedAt.getTime() + 61_000),
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError);

        expect(repository.all()[0]?.isRevoked()).toBe(false);
    });
});

class ImmediateUnitOfWork implements IUnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}

class InMemoryRefreshTokens implements IRefreshTokenRepository {
    private readonly items: RefreshToken[] = [];

    all(): readonly RefreshToken[] {
        return this.items;
    }

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        return (
            this.items.find((token) => token.tokenHash === tokenHash) ?? null
        );
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
            if (token.familyId === familyId) {
                token.revoke(at);
            }
        }
    }
}
