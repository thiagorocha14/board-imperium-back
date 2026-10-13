import { Category } from '../../../Domain/Category/Category.js';
import { CategoryEntity } from '../../../Persistence/Category/CategoryEntity.js';

export function toCategoryEntity(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = category.id;
    entity.userId = category.userId;
    entity.name = category.name;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;
    return entity;
}

export function toCategory(entity: CategoryEntity): Category {
    return Category.rehydrate(entity);
}
