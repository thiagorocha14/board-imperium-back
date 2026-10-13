import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { ListLudopediaCategories } from '../../../Domain/Ludopedia/ListLudopediaCategories/ListLudopediaCategories.js';
import { toLudopediaCategoriesResponse } from '../LudopediaResponse.js';

@ApiTags('ludopedia')
@Controller('ludopedia')
export class ListLudopediaCategoriesController {
    constructor(
        private readonly listLudopediaCategories: ListLudopediaCategories,
    ) {}

    @Get('categories')
    async execute(@CurrentUser() _user: AuthenticatedUser) {
        const categories = await this.listLudopediaCategories.execute();
        return toLudopediaCategoriesResponse(categories);
    }
}
