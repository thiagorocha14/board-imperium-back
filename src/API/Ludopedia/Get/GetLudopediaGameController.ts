import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { GetLudopediaGame } from '../../../Domain/Ludopedia/GetLudopediaGame/GetLudopediaGame.js';
import { toLudopediaGameResponse } from '../LudopediaResponse.js';

@ApiTags('ludopedia')
@Controller('ludopedia')
export class GetLudopediaGameController {
    constructor(private readonly getLudopediaGame: GetLudopediaGame) {}

    @Get('games/:ludopediaGameId')
    async execute(
        @CurrentUser() _user: AuthenticatedUser,
        @Param('ludopediaGameId') ludopediaGameId: string,
    ) {
        const game = await this.getLudopediaGame.execute(ludopediaGameId);
        return toLudopediaGameResponse(game);
    }
}
