import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../ICategoryRepository.js';

@Injectable()
export class DeleteCategory {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
    ) {}

    async execute(userId: string, categoryId: string): Promise<void> {
        const deleted = await this.categories.deleteForUser(categoryId, userId);
        if (!deleted) {
            throw new NotFoundError('Category not found');
        }
    }
}
