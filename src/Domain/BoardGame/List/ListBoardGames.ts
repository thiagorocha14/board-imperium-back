import { Inject, Injectable } from '@nestjs/common';
import { assertPage, type Page } from '../../Shared/Page.js';
import type { BoardGame } from '../BoardGame.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

@Injectable()
export class ListBoardGames {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
    ) {}

    async execute(input: {
        userId: string;
        page: number;
        pageSize: number;
    }): Promise<Page<BoardGame>> {
        assertPage(input.page, input.pageSize);
        return this.boardGames.findPageForUser(
            input.userId,
            input.page,
            input.pageSize,
        );
    }
}
