import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IUserIdentityRepository } from '../../Domain/Auth/IUserIdentityRepository.js';
import type { UserIdentity } from '../../Domain/Auth/UserIdentity.js';
import { ConflictError } from '../../Domain/Shared/DomainError.js';
import {
    toUserIdentity,
    toUserIdentityEntity,
} from '../../Utils/Mappers/Auth/UserIdentityPersistenceMapper.js';
import { isDuplicateKey } from '../MysqlErrors.js';
import { transactionContext } from '../TransactionContext.js';
import { UserIdentityEntity } from './UserIdentityEntity.js';

@Injectable()
export class UserIdentityRepository implements IUserIdentityRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByProviderSubject(
        provider: string,
        providerSubject: string,
    ): Promise<UserIdentity | null> {
        const entity = await this.repository().findOne({
            where: { provider, providerSubject },
        });
        return entity ? toUserIdentity(entity) : null;
    }

    async save(identity: UserIdentity): Promise<void> {
        try {
            await this.repository().save(toUserIdentityEntity(identity));
        } catch (error) {
            if (isDuplicateKey(error)) {
                throw new ConflictError('Identity already exists');
            }
            throw error;
        }
    }

    private repository() {
        const manager =
            transactionContext.getStore() ?? this.dataSource.manager;
        return manager.getRepository(UserIdentityEntity);
    }
}
