import { ValidationError } from '../Shared/DomainError.js';

const HASH_MIN = 50;
const HASH_MAX = 512;

export class UserCredential {
    private constructor(
        readonly userId: string,
        private passwordHashValue: string,
        readonly createdAt: Date,
        private updatedAtValue: Date,
    ) {}

    static create(input: {
        userId: string;
        passwordHash: string;
        now?: Date;
    }): UserCredential {
        const now = input.now ?? new Date();
        return new UserCredential(
            input.userId,
            assertStoredHash(input.passwordHash),
            now,
            now,
        );
    }

    static rehydrate(input: {
        userId: string;
        passwordHash: string;
        createdAt: Date;
        updatedAt: Date;
    }): UserCredential {
        return new UserCredential(
            input.userId,
            input.passwordHash,
            input.createdAt,
            input.updatedAt,
        );
    }

    get passwordHash(): string {
        return this.passwordHashValue;
    }

    get updatedAt(): Date {
        return this.updatedAtValue;
    }

    replaceHash(passwordHash: string, now: Date): void {
        this.passwordHashValue = assertStoredHash(passwordHash);
        this.updatedAtValue = now;
    }
}

function assertStoredHash(passwordHash: string): string {
    if (
        passwordHash.length < HASH_MIN ||
        passwordHash.length > HASH_MAX ||
        !passwordHash.startsWith('$argon2id$v=19$') ||
        /\s/.test(passwordHash)
    ) {
        throw new ValidationError('Password hash is invalid');
    }
    return passwordHash;
}
