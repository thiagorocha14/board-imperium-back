import { createId } from '../Shared/createId.js';
import { ValidationError } from '../Shared/DomainError.js';
import { canonicalizeEmail } from './Email.js';

const DISPLAY_NAME_MAX = 120;
const AVATAR_URL_MAX = 2048;

export class User {
    private constructor(
        readonly id: string,
        private readonly emailValue: string,
        private displayNameValue: string,
        private avatarUrlValue: string | null,
        private lastLoginAtValue: Date | null,
        readonly createdAt: Date,
        private updatedAtValue: Date,
    ) {}

    static create(input: {
        email: string;
        displayName: string;
        avatarUrl: string | null;
        now?: Date;
    }): User {
        const now = input.now ?? new Date();
        return new User(
            createId(),
            canonicalizeEmail(input.email),
            normalizeDisplayName(input.displayName),
            normalizeAvatarUrl(input.avatarUrl),
            now,
            now,
            now,
        );
    }

    static rehydrate(input: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return new User(
            input.id,
            input.email,
            input.displayName,
            input.avatarUrl,
            input.lastLoginAt,
            input.createdAt,
            input.updatedAt,
        );
    }

    get email(): string {
        return this.emailValue;
    }

    get displayName(): string {
        return this.displayNameValue;
    }

    get avatarUrl(): string | null {
        return this.avatarUrlValue;
    }

    get lastLoginAt(): Date | null {
        return this.lastLoginAtValue;
    }

    get updatedAt(): Date {
        return this.updatedAtValue;
    }

    recordLogin(input: {
        displayName: string;
        avatarUrl: string | null;
        now: Date;
    }): void {
        this.displayNameValue = normalizeDisplayName(input.displayName);
        this.avatarUrlValue = normalizeAvatarUrl(input.avatarUrl);
        this.lastLoginAtValue = input.now;
        this.updatedAtValue = input.now;
    }

    recordLocalLogin(now: Date): void {
        this.lastLoginAtValue = now;
        this.updatedAtValue = now;
    }
}

function normalizeDisplayName(displayName: string): string {
    const normalized = displayName.trim();
    if (normalized.length === 0 || normalized.length > DISPLAY_NAME_MAX) {
        throw new ValidationError(
            `Display name must be between 1 and ${DISPLAY_NAME_MAX} characters`,
        );
    }
    return normalized;
}

function normalizeAvatarUrl(avatarUrl: string | null): string | null {
    if (avatarUrl === null) {
        return null;
    }
    if (avatarUrl.length > AVATAR_URL_MAX) {
        throw new ValidationError('Avatar URL is too long');
    }
    try {
        const url = new URL(avatarUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new ValidationError('Avatar URL must use http or https');
        }
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new ValidationError('Avatar URL is invalid');
    }
    return avatarUrl;
}
