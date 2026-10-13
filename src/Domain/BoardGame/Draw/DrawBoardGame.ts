import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import type { BoardGame } from '../BoardGame.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';
import type { BoardGameDrawFilters } from './BoardGameDrawFilters.js';

@Injectable()
export class DrawBoardGame {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
    ) {}

    async execute(
        userId: string,
        filters: BoardGameDrawFilters = {},
    ): Promise<BoardGame> {
        const game = await this.boardGames.drawForUser(userId, filters);
        if (!game) {
            throw new NotFoundError(
                'No board game found for the selected filters',
            );
        }
        return game;
    }
}
