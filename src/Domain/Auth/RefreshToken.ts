import { createHash, randomBytes } from 'node:crypto';
import { createId } from '../Shared/createId.js';
import { ValidationError } from '../Shared/DomainError.js';

const USER_AGENT_MAX = 512;

export class RefreshToken {
    private constructor(
        readonly id: string,
        readonly userId: string,
        readonly familyId: string,
        readonly tokenHash: string,
        readonly expiresAt: Date,
        private revokedAtValue: Date | null,
        private replacedByIdValue: string | null,
        readonly userAgent: string | null,
        readonly createdAt: Date,
        private updatedAtValue: Date,
    ) {}

    static issue(input: {
        userId: string;
        familyId: string;
        rawToken: string;
        userAgent: string | null;
        ttlSeconds: number;
        now: Date;
    }): RefreshToken {
        if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds <= 0) {
            throw new ValidationError('Refresh token lifetime is invalid');
        }
        const expiresAt = new Date(
            input.now.getTime() + input.ttlSeconds * 1000,
        );
        return new RefreshToken(
            createId(),
            input.userId,
            input.familyId,
            hashRefreshToken(input.rawToken),
            expiresAt,
            null,
            null,
            truncateUserAgent(input.userAgent),
            input.now,
            input.now,
        );
    }

    static rehydrate(input: {
        id: string;
        userId: string;
        familyId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
        replacedById: string | null;
        userAgent: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): RefreshToken {
        return new RefreshToken(
            input.id,
            input.userId,
            input.familyId,
            input.tokenHash,
            input.expiresAt,
            input.revokedAt,
            input.replacedById,
            input.userAgent,
            input.createdAt,
            input.updatedAt,
        );
    }

    get revokedAt(): Date | null {
        return this.revokedAtValue;
    }

    get replacedById(): string | null {
        return this.replacedByIdValue;
    }

    get updatedAt(): Date {
        return this.updatedAtValue;
    }

    wasRotated(): boolean {
        return this.replacedByIdValue !== null;
    }

    isRevoked(): boolean {
        return this.revokedAtValue !== null;
    }

    isExpired(now: Date): boolean {
        return this.expiresAt.getTime() <= now.getTime();
    }

    markReplaced(replacedById: string, now: Date): void {
        this.replacedByIdValue = replacedById;
        this.revokedAtValue = now;
        this.updatedAtValue = now;
    }

    revoke(now: Date): void {
        if (this.revokedAtValue) {
            return;
        }
        this.revokedAtValue = now;
        this.updatedAtValue = now;
    }
}

export function generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function truncateUserAgent(userAgent: string | null): string | null {
    if (userAgent === null) {
        return null;
    }
    const trimmed = userAgent.trim();
    if (trimmed.length === 0) {
        return null;
    }
    return trimmed.slice(0, USER_AGENT_MAX);
}
