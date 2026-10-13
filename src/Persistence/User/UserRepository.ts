import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConflictError } from '../../Domain/Shared/DomainError.js';
import type { IUserRepository } from '../../Domain/User/IUserRepository.js';
import { normalizeEmailShape } from '../../Domain/User/Email.js';
import type { User } from '../../Domain/User/User.js';
import { isDuplicateKey } from '../MysqlErrors.js';
import { transactionContext } from '../TransactionContext.js';
import { UserEntity } from './UserEntity.js';
import {
    toUser,
    toUserEntity,
} from '../../Utils/Mappers/User/UserPersistenceMapper.js';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findById(id: string): Promise<User | null> {
        const entity = await this.repository().findOne({ where: { id } });
        return entity ? toUser(entity) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const entity = await this.repository().findOne({
            where: { email: normalizeEmailShape(email) },
        });
        return entity ? toUser(entity) : null;
    }

    async save(user: User): Promise<void> {
        try {
            await this.repository().save(toUserEntity(user));
        } catch (error) {
            if (isDuplicateKey(error)) {
                throw new ConflictError('Email already exists');
            }
            throw error;
        }
    }

    private repository() {
        const manager =
            transactionContext.getStore() ?? this.dataSource.manager;
        return manager.getRepository(UserEntity);
    }
}
