import {
    Controller,
    Delete,
    HttpCode,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { DeleteCategory } from '../../../Domain/Category/Delete/DeleteCategory.js';

@ApiTags('categories')
@Controller('categories')
export class DeleteCategoryController {
    constructor(private readonly deleteCategory: DeleteCategory) {}

    @Delete(':id')
    @HttpCode(204)
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    ): Promise<void> {
        await this.deleteCategory.execute(user.id, id);
    }
}
