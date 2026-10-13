import { Inject, Injectable } from '@nestjs/common';
import type { Category } from '../Category.js';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../ICategoryRepository.js';

@Injectable()
export class ListCategories {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
    ) {}

    async execute(userId: string): Promise<Category[]> {
        return this.categories.listForUser(userId);
    }
}
