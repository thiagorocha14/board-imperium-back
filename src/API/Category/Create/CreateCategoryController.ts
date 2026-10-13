import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { CreateCategory } from '../../../Domain/Category/Create/CreateCategory.js';
import { toCategoryResponse } from '../CategoryResponse.js';
import { CreateCategoryDTO } from './CreateCategoryDTO.js';

@ApiTags('categories')
@Controller('categories')
export class CreateCategoryController {
    constructor(private readonly createCategory: CreateCategory) {}

    @Post()
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: CreateCategoryDTO,
    ) {
        const category = await this.createCategory.execute({
            userId: user.id,
            name: body.name,
        });
        return toCategoryResponse(category);
    }
}
