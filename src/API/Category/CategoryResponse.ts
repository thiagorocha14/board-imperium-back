import type { Category } from '../../Domain/Category/Category.js';

export function toCategoryResponse(category: Category) {
    return {
        id: category.id,
        name: category.name,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
    };
}
