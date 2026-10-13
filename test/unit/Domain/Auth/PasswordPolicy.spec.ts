import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../../src/Domain/Shared/DomainError.js';
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    assertPasswordPolicy,
    isPasswordAcceptable,
} from '../../../../src/Domain/Auth/PasswordPolicy.js';

describe('password policy', () => {
    it('accepts the minimum and maximum lengths', () => {
        expect(isPasswordAcceptable('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(
            true,
        );
        expect(isPasswordAcceptable('a'.repeat(PASSWORD_MAX_LENGTH))).toBe(
            true,
        );
        expect(() =>
            assertPasswordPolicy('a'.repeat(PASSWORD_MIN_LENGTH)),
        ).not.toThrow();
        expect(() =>
            assertPasswordPolicy('a'.repeat(PASSWORD_MAX_LENGTH)),
        ).not.toThrow();
    });

    it('rejects empty, short, oversized, and whitespace-only passwords', () => {
        for (const password of [
            '',
            'a'.repeat(PASSWORD_MIN_LENGTH - 1),
            'a'.repeat(129),
            ' '.repeat(12),
        ]) {
            expect(isPasswordAcceptable(password)).toBe(false);
            expect(() => assertPasswordPolicy(password)).toThrow(
                ValidationError,
            );
        }
    });

    it('does not trim a password that contains meaningful characters', () => {
        const password = '  horse-battery';
        expect(isPasswordAcceptable(password)).toBe(true);
        expect(() => assertPasswordPolicy(password)).not.toThrow();
        expect(password.startsWith(' ')).toBe(true);
    });
});
