import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { ListLudopediaMechanics } from '../../../Domain/Ludopedia/ListLudopediaMechanics/ListLudopediaMechanics.js';
import { toLudopediaMechanicsResponse } from '../LudopediaResponse.js';

@ApiTags('ludopedia')
@Controller('ludopedia')
export class ListLudopediaMechanicsController {
    constructor(
        private readonly listLudopediaMechanics: ListLudopediaMechanics,
    ) {}

    @Get('mechanics')
    async execute(@CurrentUser() _user: AuthenticatedUser) {
        const mechanics = await this.listLudopediaMechanics.execute();
        return toLudopediaMechanicsResponse(mechanics);
    }
}
