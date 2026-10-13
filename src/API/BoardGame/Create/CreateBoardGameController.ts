import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { CreateBoardGame } from '../../../Domain/BoardGame/Create/CreateBoardGame.js';
import { toBoardGameResponse } from '../BoardGameResponse.js';
import { CreateBoardGameDTO } from './CreateBoardGameDTO.js';

@ApiTags('board-games')
@Controller('board-games')
export class CreateBoardGameController {
    constructor(private readonly createBoardGame: CreateBoardGame) {}

    @Post()
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: CreateBoardGameDTO,
    ) {
        const game = await this.createBoardGame.execute({
            userId: user.id,
            name: body.name,
            level: body.level,
            complexity: body.complexity,
            playTimeMinutes: body.playTimeMinutes,
            minPlayers: body.minPlayers,
            maxPlayers: body.maxPlayers,
            purchasedAt: body.purchasedAt ?? null,
            imageUrl: body.imageUrl ?? null,
            categoryIds: body.categoryIds ?? [],
            mechanicIds: body.mechanicIds ?? [],
        });
        return toBoardGameResponse(game);
    }
}
