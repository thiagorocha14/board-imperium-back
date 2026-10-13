import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { ListBoardGameCollection } from '../../../Domain/BoardGame/Collection/ListBoardGameCollection.js';
import { toBoardGameCollectionItem } from './BoardGameCollectionResponse.js';

@ApiTags('board-games')
@Controller('board-games')
export class ListBoardGameCollectionController {
    constructor(
        private readonly listBoardGameCollection: ListBoardGameCollection,
    ) {}

    @Get('collection')
    async execute(@CurrentUser() user: AuthenticatedUser) {
        const games = await this.listBoardGameCollection.execute(user.id);
        return games.map(toBoardGameCollectionItem);
    }
}
