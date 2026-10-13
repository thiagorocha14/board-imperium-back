import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import {
    REFRESH_TOKEN_REPOSITORY,
    type IRefreshTokenRepository,
} from '../IRefreshTokenRepository.js';
import { hashRefreshToken } from '../RefreshToken.js';

@Injectable()
export class RevokeRefreshTokenFamily {
    constructor(
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokens: IRefreshTokenRepository,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(
        rawToken: string | null,
        now: Date = new Date(),
    ): Promise<void> {
        if (!rawToken) {
            return;
        }
        const tokenHash = hashRefreshToken(rawToken);
        await this.unitOfWork.run(async () => {
            const current = await this.refreshTokens.findByHash(tokenHash);
            if (!current) {
                return;
            }
            await this.refreshTokens.revokeFamily(current.familyId, now);
        });
    }
}
