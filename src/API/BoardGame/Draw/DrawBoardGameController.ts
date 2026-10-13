import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import type { BoardGameDrawFilters } from '../../../Domain/BoardGame/Draw/BoardGameDrawFilters.js';
import { DrawBoardGame } from '../../../Domain/BoardGame/Draw/DrawBoardGame.js';
import { toBoardGameResponse } from '../BoardGameResponse.js';
import { DrawBoardGameQueryDTO } from './DrawBoardGameQueryDTO.js';

@ApiTags('board-games')
@Controller('board-games')
export class DrawBoardGameController {
    constructor(private readonly drawBoardGame: DrawBoardGame) {}

    @Get('draw')
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: DrawBoardGameQueryDTO,
    ) {
        const game = await this.drawBoardGame.execute(
            user.id,
            drawFilters(query),
        );
        return toBoardGameResponse(game);
    }
}

function drawFilters(query: DrawBoardGameQueryDTO): BoardGameDrawFilters {
    return {
        ...(query.level !== undefined ? { level: query.level } : {}),
        ...(query.categoryId !== undefined
            ? { categoryId: query.categoryId }
            : {}),
        ...(query.mechanicId !== undefined
            ? { mechanicId: query.mechanicId }
            : {}),
    };
}
