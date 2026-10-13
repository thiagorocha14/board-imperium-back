import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { UpdateBoardGame } from '../../../Domain/BoardGame/Update/UpdateBoardGame.js';
import { toBoardGameResponse } from '../BoardGameResponse.js';
import { UpdateBoardGameDTO } from './UpdateBoardGameDTO.js';

@ApiTags('board-games')
@Controller('board-games')
export class UpdateBoardGameController {
    constructor(private readonly updateBoardGame: UpdateBoardGame) {}

    @Patch(':id')
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
        @Body() body: UpdateBoardGameDTO,
    ) {
        const game = await this.updateBoardGame.execute({
            userId: user.id,
            boardGameId: id,
            name: body.name,
            level: body.level,
            complexity: body.complexity,
            playTimeMinutes: body.playTimeMinutes,
            minPlayers: body.minPlayers,
            maxPlayers: body.maxPlayers,
            purchasedAt: body.purchasedAt,
            imageUrl: body.imageUrl,
            categoryIds: body.categoryIds,
            mechanicIds: body.mechanicIds,
        });
        return toBoardGameResponse(game);
    }
}
