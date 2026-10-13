import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { GetBoardGame } from '../../../Domain/BoardGame/Get/GetBoardGame.js';
import { toBoardGameResponse } from '../BoardGameResponse.js';

@ApiTags('board-games')
@Controller('board-games')
export class GetBoardGameController {
    constructor(private readonly getBoardGame: GetBoardGame) {}

    @Get(':id')
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    ) {
        const game = await this.getBoardGame.execute(user.id, id);
        return toBoardGameResponse(game);
    }
}
