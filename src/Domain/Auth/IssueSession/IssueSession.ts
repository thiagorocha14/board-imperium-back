import { Inject, Injectable } from '@nestjs/common';
import { createId } from '../../Shared/createId.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import {
    REFRESH_TOKEN_REPOSITORY,
    type IRefreshTokenRepository,
} from '../IRefreshTokenRepository.js';
import { generateRefreshToken, RefreshToken } from '../RefreshToken.js';

@Injectable()
export class IssueSession {
    constructor(
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokens: IRefreshTokenRepository,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: {
        userId: string;
        userAgent: string | null;
        ttlSeconds: number;
        now?: Date;
    }): Promise<{ rawRefreshToken: string }> {
        const now = input.now ?? new Date();
        return this.unitOfWork.run(async () => {
            const rawRefreshToken = generateRefreshToken();
            await this.refreshTokens.save(
                RefreshToken.issue({
                    userId: input.userId,
                    familyId: createId(),
                    rawToken: rawRefreshToken,
                    userAgent: input.userAgent,
                    ttlSeconds: input.ttlSeconds,
                    now,
                }),
            );
            return { rawRefreshToken };
        });
    }
}
