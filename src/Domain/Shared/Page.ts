import { ValidationError } from './DomainError.js';

export interface Page<T> {
    items: readonly T[];
    page: number;
    pageSize: number;
    totalItems: number;
}

export const MAX_PAGE_SIZE = 100;

export function assertPage(page: number, pageSize: number): void {
    if (!Number.isInteger(page) || page < 1) {
        throw new ValidationError(
            'Page must be an integer greater than or equal to 1',
        );
    }
    if (
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > MAX_PAGE_SIZE
    ) {
        throw new ValidationError(
            `Page size must be an integer between 1 and ${MAX_PAGE_SIZE}`,
        );
    }
}
