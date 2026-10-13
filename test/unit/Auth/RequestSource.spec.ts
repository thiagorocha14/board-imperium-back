import { describe, expect, it } from 'vitest';
import { isAllowedRequestSource } from '../../../src/Auth/RequestSource.js';

const front = 'http://localhost:4200';

describe('request source', () => {
    it('accepts the configured front origin', () => {
        expect(isAllowedRequestSource(front, undefined, front)).toBe(true);
    });

    it('accepts a referer on that origin when origin is absent', () => {
        expect(
            isAllowedRequestSource(
                undefined,
                'http://localhost:4200/games',
                front,
            ),
        ).toBe(true);
    });

    it('rejects a different origin', () => {
        expect(
            isAllowedRequestSource('https://evil.example', undefined, front),
        ).toBe(false);
    });

    it('rejects a missing origin and referer', () => {
        expect(isAllowedRequestSource(undefined, undefined, front)).toBe(false);
    });
});
