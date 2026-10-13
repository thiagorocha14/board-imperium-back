import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { ListBoardGames } from '../../../Domain/BoardGame/List/ListBoardGames.js';
import { toBoardGameResponse } from '../BoardGameResponse.js';
import { PageQueryDTO } from './PageQueryDTO.js';

@ApiTags('board-games')
@Controller('board-games')
export class ListBoardGamesController {
    constructor(private readonly listBoardGames: ListBoardGames) {}

    @Get()
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: PageQueryDTO,
    ) {
        const page = await this.listBoardGames.execute({
            userId: user.id,
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 20,
        });
        return {
            items: page.items.map(toBoardGameResponse),
            page: page.page,
            pageSize: page.pageSize,
            totalItems: page.totalItems,
        };
    }
}
