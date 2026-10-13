import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../Shared/DomainError.js';
import { normalizeCategoryName, type Category } from '../Category.js';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../ICategoryRepository.js';

@Injectable()
export class UpdateCategory {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
    ) {}

    async execute(input: {
        userId: string;
        categoryId: string;
        name: string;
    }): Promise<Category> {
        const category = await this.categories.findByIdForUser(
            input.categoryId,
            input.userId,
        );
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        const name = normalizeCategoryName(input.name);
        if (name.toLowerCase() !== category.name.toLowerCase()) {
            const other = await this.categories.findByNameForUser(
                input.userId,
                name,
            );
            if (other && other.id !== category.id) {
                throw new ConflictError('Category name already exists');
            }
        }
        category.rename(name, new Date());
        await this.categories.save(category);
        return category;
    }
}
