import type { RefreshToken } from './RefreshToken.js';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository {
    findByHash(tokenHash: string): Promise<RefreshToken | null>;
    save(token: RefreshToken): Promise<void>;
    revokeFamily(familyId: string, at: Date): Promise<void>;
}
