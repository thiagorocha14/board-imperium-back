// OWASP Password Storage Cheat Sheet profiles for Argon2id.
// A configuration is accepted only when it meets an entire profile.
const OWASP_ARGON2ID_PROFILES = [
    { memoryCost: 47_104, timeCost: 1, parallelism: 1 },
    { memoryCost: 19_456, timeCost: 2, parallelism: 1 },
    { memoryCost: 12_288, timeCost: 3, parallelism: 1 },
    { memoryCost: 9_216, timeCost: 4, parallelism: 1 },
    { memoryCost: 7_168, timeCost: 5, parallelism: 1 },
] as const;

// Baseline highlighted by OWASP: 19 MiB, 2 iterations, parallelism 1.
export const ARGON2ID_PARAMETERS = {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
} as const;

export const ARGON2ID_ALGORITHM = 2 as const;
export const ARGON2_VERSION_19 = 1 as const;

export function assertArgon2idParameters(params: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
}): void {
    const integers =
        Number.isInteger(params.memoryCost) &&
        Number.isInteger(params.timeCost) &&
        Number.isInteger(params.parallelism);
    const meetsProfile = OWASP_ARGON2ID_PROFILES.some(
        (profile) =>
            params.memoryCost >= profile.memoryCost &&
            params.timeCost >= profile.timeCost &&
            params.parallelism >= profile.parallelism,
    );
    if (!integers || !meetsProfile) {
        throw new Error('Argon2id parameters are below the OWASP minimum');
    }
}
