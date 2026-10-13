import { ValidationError } from '../Shared/DomainError.js';

const EMAIL_MAX = 320;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmailShape(email: string): string {
    return email.trim().toLowerCase();
}

export function canonicalizeEmail(email: string): string {
    const normalized = normalizeEmailShape(email);
    if (
        normalized.length === 0 ||
        normalized.length > EMAIL_MAX ||
        !EMAIL_PATTERN.test(normalized)
    ) {
        throw new ValidationError('Email is invalid');
    }
    return normalized;
}
