import type { Category } from './Category.js';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
    findByIdForUser(id: string, userId: string): Promise<Category | null>;
    findByIdsForUser(
        ids: readonly string[],
        userId: string,
    ): Promise<Category[]>;
    findByNameForUser(userId: string, name: string): Promise<Category | null>;
    listForUser(userId: string): Promise<Category[]>;
    save(category: Category): Promise<void>;
    deleteForUser(id: string, userId: string): Promise<boolean>;
}
