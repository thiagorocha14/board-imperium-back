import { createId } from '../Shared/createId.js';
import { ValidationError } from '../Shared/DomainError.js';

export const CATEGORY_NAME_MAX = 80;

export class Category {
    private constructor(
        readonly id: string,
        readonly userId: string,
        private nameValue: string,
        readonly createdAt: Date,
        private updatedAtValue: Date,
    ) {}

    static create(input: {
        userId: string;
        name: string;
        now?: Date;
    }): Category {
        const now = input.now ?? new Date();
        return new Category(
            createId(),
            input.userId,
            normalizeCategoryName(input.name),
            now,
            now,
        );
    }

    static rehydrate(input: {
        id: string;
        userId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }): Category {
        return new Category(
            input.id,
            input.userId,
            input.name,
            input.createdAt,
            input.updatedAt,
        );
    }

    get name(): string {
        return this.nameValue;
    }

    get updatedAt(): Date {
        return this.updatedAtValue;
    }

    rename(name: string, now: Date): void {
        this.nameValue = normalizeCategoryName(name);
        this.updatedAtValue = now;
    }
}

export function normalizeCategoryName(name: string): string {
    const normalized = name.trim();
    if (normalized.length === 0 || normalized.length > CATEGORY_NAME_MAX) {
        throw new ValidationError(
            `Category name must be between 1 and ${CATEGORY_NAME_MAX} characters`,
        );
    }
    return normalized;
}
