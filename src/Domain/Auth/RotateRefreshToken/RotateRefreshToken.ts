import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import {
    REFRESH_TOKEN_REPOSITORY,
    type IRefreshTokenRepository,
} from '../IRefreshTokenRepository.js';
import {
    generateRefreshToken,
    hashRefreshToken,
    RefreshToken,
} from '../RefreshToken.js';

export interface RotateRefreshTokenResult {
    userId: string;
    rawRefreshToken: string;
}

@Injectable()
export class RotateRefreshToken {
    constructor(
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokens: IRefreshTokenRepository,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: {
        rawToken: string;
        userAgent: string | null;
        ttlSeconds: number;
        now?: Date;
    }): Promise<RotateRefreshTokenResult> {
        const now = input.now ?? new Date();
        const tokenHash = hashRefreshToken(input.rawToken);
        let compromisedFamilyId: string | null = null;

        try {
            return await this.unitOfWork.run(async () => {
                const current = await this.refreshTokens.findByHash(tokenHash);
                if (!current) {
                    throw new UnauthorizedError('Authentication failed');
                }

                if (current.wasRotated() || current.isRevoked()) {
                    compromisedFamilyId = current.familyId;
                    throw new UnauthorizedError('Authentication failed');
                }

                if (current.isExpired(now)) {
                    throw new UnauthorizedError('Authentication failed');
                }

                const rawRefreshToken = generateRefreshToken();
                const next = RefreshToken.issue({
                    userId: current.userId,
                    familyId: current.familyId,
                    rawToken: rawRefreshToken,
                    userAgent: input.userAgent,
                    ttlSeconds: input.ttlSeconds,
                    now,
                });
                await this.refreshTokens.save(next);
                current.markReplaced(next.id, now);
                await this.refreshTokens.save(current);
                return { userId: current.userId, rawRefreshToken };
            });
        } catch (error) {
            if (compromisedFamilyId) {
                const familyId = compromisedFamilyId;
                await this.unitOfWork.run(() =>
                    this.refreshTokens.revokeFamily(familyId, now),
                );
            }
            throw error;
        }
    }
}
