import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { ListCategories } from '../../../Domain/Category/List/ListCategories.js';
import { toCategoryResponse } from '../CategoryResponse.js';

@ApiTags('categories')
@Controller('categories')
export class ListCategoriesController {
    constructor(private readonly listCategories: ListCategories) {}

    @Get()
    async execute(@CurrentUser() user: AuthenticatedUser) {
        const categories = await this.listCategories.execute(user.id);
        return categories.map(toCategoryResponse);
    }
}
