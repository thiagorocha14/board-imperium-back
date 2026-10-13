import { Inject, Injectable } from '@nestjs/common';
import type { BoardGame } from '../BoardGame.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

@Injectable()
export class ListBoardGameCollection {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
    ) {}

    async execute(userId: string): Promise<BoardGame[]> {
        return this.boardGames.findAllForUser(userId);
    }
}
