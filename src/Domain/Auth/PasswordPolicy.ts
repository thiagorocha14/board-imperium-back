import { ValidationError } from '../Shared/DomainError.js';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function isPasswordAcceptable(password: string): boolean {
    return (
        typeof password === 'string' &&
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH &&
        password.trim().length > 0
    );
}

export function assertPasswordPolicy(password: string): void {
    if (!isPasswordAcceptable(password)) {
        throw new ValidationError('Password is invalid');
    }
}
