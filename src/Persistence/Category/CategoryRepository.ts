import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import type { ICategoryRepository } from '../../Domain/Category/ICategoryRepository.js';
import type { Category } from '../../Domain/Category/Category.js';
import { ConflictError } from '../../Domain/Shared/DomainError.js';
import {
    toCategory,
    toCategoryEntity,
} from '../../Utils/Mappers/Category/CategoryPersistenceMapper.js';
import { isDuplicateKey } from '../MysqlErrors.js';
import { transactionContext } from '../TransactionContext.js';
import { CategoryEntity } from './CategoryEntity.js';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByIdForUser(
        id: string,
        userId: string,
    ): Promise<Category | null> {
        const entity = await this.repository().findOne({
            where: { id, userId },
        });
        return entity ? toCategory(entity) : null;
    }

    async findByIdsForUser(
        ids: readonly string[],
        userId: string,
    ): Promise<Category[]> {
        if (ids.length === 0) {
            return [];
        }
        const entities = await this.repository().find({
            where: { id: In([...ids]), userId },
        });
        return entities.map(toCategory);
    }

    async findByNameForUser(
        userId: string,
        name: string,
    ): Promise<Category | null> {
        const entity = await this.repository().findOne({
            where: { userId, name },
        });
        return entity ? toCategory(entity) : null;
    }

    async listForUser(userId: string): Promise<Category[]> {
        const entities = await this.repository().find({
            where: { userId },
            order: { name: 'ASC' },
        });
        return entities.map(toCategory);
    }

    async save(category: Category): Promise<void> {
        try {
            await this.repository().save(toCategoryEntity(category));
        } catch (error) {
            if (isDuplicateKey(error)) {
                throw new ConflictError('Category name already exists');
            }
            throw error;
        }
    }

    async deleteForUser(id: string, userId: string): Promise<boolean> {
        const result = await this.repository().delete({ id, userId });
        return (result.affected ?? 0) > 0;
    }

    private repository() {
        const manager =
            transactionContext.getStore() ?? this.dataSource.manager;
        return manager.getRepository(CategoryEntity);
    }
}
