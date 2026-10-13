import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { GetCategory } from '../../../Domain/Category/Get/GetCategory.js';
import { toCategoryResponse } from '../CategoryResponse.js';

@ApiTags('categories')
@Controller('categories')
export class GetCategoryController {
    constructor(private readonly getCategory: GetCategory) {}

    @Get(':id')
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    ) {
        const category = await this.getCategory.execute(user.id, id);
        return toCategoryResponse(category);
    }
}
