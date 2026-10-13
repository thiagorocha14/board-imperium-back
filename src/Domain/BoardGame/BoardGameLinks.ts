import type { ICategoryRepository } from '../Category/ICategoryRepository.js';
import type { IMechanicRepository } from '../Mechanic/IMechanicRepository.js';
import { NotFoundError } from '../Shared/DomainError.js';

export async function assertOwnedCategories(
    categories: ICategoryRepository,
    userId: string,
    categoryIds: readonly string[],
): Promise<void> {
    const unique = [...new Set(categoryIds)];
    if (unique.length === 0) {
        return;
    }
    const found = await categories.findByIdsForUser(unique, userId);
    if (found.length !== unique.length) {
        throw new NotFoundError('Category not found');
    }
}

export async function assertMechanicsExist(
    mechanics: IMechanicRepository,
    mechanicIds: readonly string[],
): Promise<void> {
    const unique = [...new Set(mechanicIds)];
    if (unique.length === 0) {
        return;
    }
    const found = await mechanics.findByIds(unique);
    if (found.length !== unique.length) {
        throw new NotFoundError('Mechanic not found');
    }
}
