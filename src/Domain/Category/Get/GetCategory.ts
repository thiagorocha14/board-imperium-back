import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import type { Category } from '../Category.js';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../ICategoryRepository.js';

@Injectable()
export class GetCategory {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
    ) {}

    async execute(userId: string, categoryId: string): Promise<Category> {
        const category = await this.categories.findByIdForUser(
            categoryId,
            userId,
        );
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        return category;
    }
}
