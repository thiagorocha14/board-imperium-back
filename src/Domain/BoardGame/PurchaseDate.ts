import { ValidationError } from '../Shared/DomainError.js';

export const PURCHASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class PurchaseDate {
    private constructor(readonly value: string) {}

    static create(value: string, now: Date): PurchaseDate {
        const parsed = PurchaseDate.parse(value);
        // UTC calendar day of the use case clock, so the check does not follow the server timezone.
        if (parsed.value > calendarDateUtc(now)) {
            throw new ValidationError('Purchase date cannot be in the future');
        }
        return parsed;
    }

    static parse(value: string): PurchaseDate {
        const normalized = value.trim();
        if (!PURCHASE_DATE_PATTERN.test(normalized)) {
            throw new ValidationError(
                'Purchase date must be a calendar date in YYYY-MM-DD',
            );
        }
        const year = Number(normalized.slice(0, 4));
        const month = Number(normalized.slice(5, 7));
        const day = Number(normalized.slice(8, 10));
        const utc = new Date(Date.UTC(year, month - 1, day));
        if (
            utc.getUTCFullYear() !== year ||
            utc.getUTCMonth() !== month - 1 ||
            utc.getUTCDate() !== day
        ) {
            throw new ValidationError('Purchase date is invalid');
        }
        return new PurchaseDate(normalized);
    }
}

function calendarDateUtc(now: Date): string {
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
