import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import type { BoardGame } from '../BoardGame.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

@Injectable()
export class GetBoardGame {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
    ) {}

    async execute(userId: string, boardGameId: string): Promise<BoardGame> {
        const game = await this.boardGames.findByIdForUser(boardGameId, userId);
        if (!game) {
            throw new NotFoundError('Board game not found');
        }
        return game;
    }
}
