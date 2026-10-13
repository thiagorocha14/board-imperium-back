import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '../../Shared/DomainError.js';
import { Category, normalizeCategoryName } from '../Category.js';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../ICategoryRepository.js';

@Injectable()
export class CreateCategory {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
    ) {}

    async execute(input: { userId: string; name: string }): Promise<Category> {
        const name = normalizeCategoryName(input.name);
        const existing = await this.categories.findByNameForUser(
            input.userId,
            name,
        );
        if (existing) {
            throw new ConflictError('Category name already exists');
        }
        const category = Category.create({ userId: input.userId, name });
        await this.categories.save(category);
        return category;
    }
}
