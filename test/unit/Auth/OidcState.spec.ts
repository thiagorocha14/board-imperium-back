import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../../src/Domain/Shared/DomainError.js';
import {
    assertMatchingState,
    timingSafeEqualString,
} from '../../../src/Auth/OidcState.js';

describe('OIDC state', () => {
    it('accepts an identical state', () => {
        expect(timingSafeEqualString('state-value', 'state-value')).toBe(true);
        expect(() =>
            assertMatchingState('state-value', 'state-value'),
        ).not.toThrow();
    });

    it('rejects a different state', () => {
        expect(timingSafeEqualString('expected', 'received')).toBe(false);
        expect(() => assertMatchingState('expected', 'received')).toThrow(
            UnauthorizedError,
        );
    });

    it('rejects a state with a different length', () => {
        expect(timingSafeEqualString('short', 'much-longer-state')).toBe(false);
    });
});
