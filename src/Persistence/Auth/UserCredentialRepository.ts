import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IUserCredentialRepository } from '../../Domain/Auth/IUserCredentialRepository.js';
import type { UserCredential } from '../../Domain/Auth/UserCredential.js';
import {
    ConflictError,
    ValidationError,
} from '../../Domain/Shared/DomainError.js';
import {
    toUserCredential,
    toUserCredentialEntity,
} from '../../Utils/Mappers/Auth/UserCredentialPersistenceMapper.js';
import {
    isCheckViolation,
    isDuplicateKey,
    isForeignKeyViolation,
} from '../MysqlErrors.js';
import { transactionContext } from '../TransactionContext.js';
import { UserCredentialEntity } from './UserCredentialEntity.js';

@Injectable()
export class UserCredentialRepository implements IUserCredentialRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByUserId(userId: string): Promise<UserCredential | null> {
        const entity = await this.repository().findOne({ where: { userId } });
        return entity ? toUserCredential(entity) : null;
    }

    async save(credential: UserCredential): Promise<void> {
        try {
            await this.repository().save(toUserCredentialEntity(credential));
        } catch (error) {
            if (isDuplicateKey(error) || isForeignKeyViolation(error)) {
                throw new ConflictError('Credential already exists');
            }
            if (isCheckViolation(error)) {
                throw new ValidationError('Password hash is invalid');
            }
            throw error;
        }
    }

    private repository() {
        const manager =
            transactionContext.getStore() ?? this.dataSource.manager;
        return manager.getRepository(UserCredentialEntity);
    }
}
