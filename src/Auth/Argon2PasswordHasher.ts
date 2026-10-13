import { Injectable, type OnModuleInit } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
    hash as argon2Hash,
    parseOptions,
    verify as argon2Verify,
} from '@node-rs/argon2';
import type { IPasswordHasher } from '../Domain/Auth/IPasswordHasher.js';
import {
    assertPasswordPolicy,
    isPasswordAcceptable,
} from '../Domain/Auth/PasswordPolicy.js';
import {
    ARGON2ID_ALGORITHM,
    ARGON2ID_PARAMETERS,
    ARGON2_VERSION_19,
    assertArgon2idParameters,
} from './Argon2Parameters.js';

const HASH_PREFIX = '$argon2id$v=19$';

@Injectable()
export class Argon2PasswordHasher implements IPasswordHasher, OnModuleInit {
    private dummyTask: Promise<string> | null = null;

    constructor() {
        assertArgon2idParameters(ARGON2ID_PARAMETERS);
    }

    onModuleInit(): Promise<void> {
        return this.dummyHash().then(() => undefined);
    }

    async hash(password: string): Promise<string> {
        assertPasswordPolicy(password);
        const encoded = await argon2Hash(password, {
            algorithm: ARGON2ID_ALGORITHM,
            version: ARGON2_VERSION_19,
            memoryCost: ARGON2ID_PARAMETERS.memoryCost,
            timeCost: ARGON2ID_PARAMETERS.timeCost,
            parallelism: ARGON2ID_PARAMETERS.parallelism,
            outputLen: 32,
        });
        if (!encoded.startsWith(HASH_PREFIX) || encoded.length > 512) {
            throw new Error('Argon2id hasher returned an unexpected encoding');
        }
        return encoded;
    }

    async verify(password: string, passwordHash: string): Promise<boolean> {
        if (
            !isPasswordAcceptable(password) ||
            !passwordHash.startsWith('$argon2id$')
        ) {
            return false;
        }
        try {
            return await argon2Verify(passwordHash, password);
        } catch {
            return false;
        }
    }

    needsRehash(passwordHash: string): boolean {
        try {
            const parsed = parseOptions(passwordHash);
            return (
                parsed.algorithm !== ARGON2ID_ALGORITHM ||
                parsed.version !== ARGON2_VERSION_19 ||
                parsed.memoryCost < ARGON2ID_PARAMETERS.memoryCost ||
                parsed.timeCost < ARGON2ID_PARAMETERS.timeCost ||
                parsed.parallelism < ARGON2ID_PARAMETERS.parallelism ||
                parsed.outputLen < 32 ||
                parsed.saltLen < 16
            );
        } catch {
            return true;
        }
    }

    dummyHash(): Promise<string> {
        this.dummyTask ??= this.createDummyHash();
        return this.dummyTask;
    }

    private async createDummyHash(): Promise<string> {
        const encoded = await this.hash(randomBytes(32).toString('base64url'));
        if (!encoded.startsWith(HASH_PREFIX)) {
            throw new Error('Argon2id hasher returned an unexpected encoding');
        }
        return encoded;
    }
}
