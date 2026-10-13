import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

@Injectable()
export class DeleteBoardGame {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
    ) {}

    async execute(userId: string, boardGameId: string): Promise<void> {
        const deleted = await this.boardGames.deleteForUser(
            boardGameId,
            userId,
        );
        if (!deleted) {
            throw new NotFoundError('Board game not found');
        }
    }
}
