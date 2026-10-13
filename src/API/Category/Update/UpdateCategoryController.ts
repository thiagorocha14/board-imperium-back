import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { UpdateCategory } from '../../../Domain/Category/Update/UpdateCategory.js';
import { toCategoryResponse } from '../CategoryResponse.js';
import { UpdateCategoryDTO } from './UpdateCategoryDTO.js';

@ApiTags('categories')
@Controller('categories')
export class UpdateCategoryController {
    constructor(private readonly updateCategory: UpdateCategory) {}

    @Patch(':id')
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
        @Body() body: UpdateCategoryDTO,
    ) {
        const category = await this.updateCategory.execute({
            userId: user.id,
            categoryId: id,
            name: body.name,
        });
        return toCategoryResponse(category);
    }
}
