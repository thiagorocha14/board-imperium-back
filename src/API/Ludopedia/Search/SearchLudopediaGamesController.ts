import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { SearchLudopediaGames } from '../../../Domain/Ludopedia/SearchLudopediaGames/SearchLudopediaGames.js';
import { toLudopediaGameSearchResponse } from '../LudopediaResponse.js';
import { SearchLudopediaGamesQueryDTO } from './SearchLudopediaGamesQueryDTO.js';

@ApiTags('ludopedia')
@Controller('ludopedia')
export class SearchLudopediaGamesController {
    constructor(private readonly searchLudopediaGames: SearchLudopediaGames) {}

    @Get('games')
    async execute(
        @CurrentUser() _user: AuthenticatedUser,
        @Query() query: SearchLudopediaGamesQueryDTO,
    ) {
        const result = await this.searchLudopediaGames.execute({
            search: query.search,
            page: query.page,
            rows: query.rows,
        });
        return toLudopediaGameSearchResponse(result);
    }
}
