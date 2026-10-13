import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IRefreshTokenRepository } from '../../Domain/Auth/IRefreshTokenRepository.js';
import type { RefreshToken } from '../../Domain/Auth/RefreshToken.js';
import {
    toRefreshToken,
    toRefreshTokenEntity,
} from '../../Utils/Mappers/Auth/RefreshTokenPersistenceMapper.js';
import { transactionContext } from '../TransactionContext.js';
import { RefreshTokenEntity } from './RefreshTokenEntity.js';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByHash(tokenHash: string): Promise<RefreshToken | null> {
        const locked = transactionContext.getStore() !== undefined;
        const entity = await this.repository().findOne({
            where: { tokenHash },
            ...(locked ? { lock: { mode: 'pessimistic_write' as const } } : {}),
        });
        return entity ? toRefreshToken(entity) : null;
    }

    async save(token: RefreshToken): Promise<void> {
        await this.repository().save(toRefreshTokenEntity(token));
    }

    async revokeFamily(familyId: string, at: Date): Promise<void> {
        await this.repository()
            .createQueryBuilder()
            .update(RefreshTokenEntity)
            .set({ revokedAt: at, updatedAt: at })
            .where('family_id = :familyId', { familyId })
            .andWhere('revoked_at IS NULL')
            .execute();
    }

    private repository() {
        const manager =
            transactionContext.getStore() ?? this.dataSource.manager;
        return manager.getRepository(RefreshTokenEntity);
    }
}
