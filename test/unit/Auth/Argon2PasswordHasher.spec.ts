import { beforeAll, describe, expect, it } from 'vitest';
import { ValidationError } from '../../../src/Domain/Shared/DomainError.js';
import { Argon2PasswordHasher } from '../../../src/Auth/Argon2PasswordHasher.js';
import {
    ARGON2ID_PARAMETERS,
    assertArgon2idParameters,
} from '../../../src/Auth/Argon2Parameters.js';

const PASSWORD = 'correct horse battery';

describe('Argon2PasswordHasher', () => {
    const hasher = new Argon2PasswordHasher();

    beforeAll(async () => {
        await hasher.onModuleInit();
    });

    it('uses a random salt and verifies only the original password', async () => {
        const first = await hasher.hash(PASSWORD);
        const second = await hasher.hash(PASSWORD);
        expect(first).not.toBe(second);
        expect(first.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
        expect(await hasher.verify(PASSWORD, first)).toBe(true);
        expect(await hasher.verify(`${PASSWORD} `, first)).toBe(false);
        expect(hasher.needsRehash(first)).toBe(false);
    });

    it('rehashes weaker parameters and keeps stronger ones', async () => {
        const encoded = await hasher.hash(PASSWORD);
        const weaker = encoded.replace('m=19456,t=2,p=1', 'm=19456,t=1,p=1');
        const stronger = encoded.replace('m=19456,t=2,p=1', 'm=47104,t=2,p=1');
        expect(hasher.needsRehash(weaker)).toBe(true);
        expect(hasher.needsRehash(stronger)).toBe(false);
        expect(
            hasher.needsRehash(encoded.replace('$argon2id$', '$argon2i$')),
        ).toBe(true);
    });

    it('rejects a non Argon2id encoding without throwing', async () => {
        expect(await hasher.verify(PASSWORD, 'not-a-hash')).toBe(false);
        expect(
            await hasher.verify(
                PASSWORD,
                '$argon2i$v=19$m=19456,t=2,p=1$abc$def',
            ),
        ).toBe(false);
        expect(hasher.needsRehash('not-a-hash')).toBe(true);
    });

    it('verifies unknown passwords against a stable dummy hash', async () => {
        const dummy = await hasher.dummyHash();
        expect(dummy).toBe(await hasher.dummyHash());
        expect(dummy.startsWith('$argon2id$')).toBe(true);
        expect(await hasher.verify(PASSWORD, dummy)).toBe(false);
    });

    it('refuses to hash a password outside the policy', async () => {
        await expect(hasher.hash('1234567')).rejects.toBeInstanceOf(
            ValidationError,
        );
    });

    it('rejects Argon2id parameters below the OWASP profiles', () => {
        expect(() =>
            assertArgon2idParameters(ARGON2ID_PARAMETERS),
        ).not.toThrow();
        expect(() =>
            assertArgon2idParameters({
                memoryCost: 4096,
                timeCost: 3,
                parallelism: 1,
            }),
        ).toThrow(/OWASP/);
        expect(() =>
            assertArgon2idParameters({
                memoryCost: 19_456,
                timeCost: 1,
                parallelism: 1,
            }),
        ).toThrow(/OWASP/);
    });
});
