import {
    Controller,
    Delete,
    HttpCode,
    Param,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { DeleteBoardGame } from '../../../Domain/BoardGame/Delete/DeleteBoardGame.js';

@ApiTags('board-games')
@Controller('board-games')
export class DeleteBoardGameController {
    constructor(private readonly deleteBoardGame: DeleteBoardGame) {}

    @Delete(':id')
    @HttpCode(204)
    async execute(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    ): Promise<void> {
        await this.deleteBoardGame.execute(user.id, id);
    }
}
