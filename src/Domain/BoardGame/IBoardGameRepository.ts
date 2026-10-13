import type { Page } from '../Shared/Page.js';
import type { BoardGame } from './BoardGame.js';
import type { BoardGameDrawFilters } from './Draw/BoardGameDrawFilters.js';

export const BOARD_GAME_REPOSITORY = Symbol('BOARD_GAME_REPOSITORY');

export interface IBoardGameRepository {
    findByIdForUser(id: string, userId: string): Promise<BoardGame | null>;
    findByNameForUser(userId: string, name: string): Promise<BoardGame | null>;
    findPageForUser(
        userId: string,
        page: number,
        pageSize: number,
    ): Promise<Page<BoardGame>>;
    findAllForUser(userId: string): Promise<BoardGame[]>;
    drawForUser(
        userId: string,
        filters: BoardGameDrawFilters,
    ): Promise<BoardGame | null>;
    save(game: BoardGame): Promise<void>;
    deleteForUser(id: string, userId: string): Promise<boolean>;
}
